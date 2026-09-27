"use client";

import Image from "next/image";
import { AnimatePresence, motion, Reorder } from "motion/react";
import { CloudUpload, Film, GripVertical, Star, Trash2, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cldPoster } from "@/lib/cld";
import { api } from "@/lib/hooks";
import { cn, formatBytes } from "@/lib/utils";
import type { Media } from "@/lib/types";

type AssetRef = Pick<Media, "publicId" | "resourceType">;
type Area = "products" | "categories" | "banners" | "misc";

const LIMITS = { image: 10 * 1024 * 1024, video: 100 * 1024 * 1024 };

/**
 * Tracks assets uploaded during this form session that haven't been saved yet.
 * If the form is abandoned (navigate away, tab closed) they are deleted from Cloudinary,
 * so an unsaved upload never lingers as stale storage.
 */
export function useUploadSession() {
  const pending = useRef(new Map<string, AssetRef>());

  const flush = useCallback(() => {
    if (!pending.current.size) return;
    const body = JSON.stringify({ assets: [...pending.current.values()] });
    pending.current.clear();
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/admin/media/discard", blob)) {
      fetch("/api/admin/media/discard", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

  return {
    track: (m: AssetRef) => pending.current.set(m.publicId, { publicId: m.publicId, resourceType: m.resourceType }),
    isPending: (publicId: string) => pending.current.has(publicId),
    /** Immediately delete an unsaved upload. */
    discard: async (m: AssetRef) => {
      pending.current.delete(m.publicId);
      await api("/api/admin/media/discard", { method: "POST", json: { assets: [{ publicId: m.publicId, resourceType: m.resourceType }] } }).catch(() => {});
    },
    /**
     * Call after a successful save with the media that was saved. Those uploads are now owned by a
     * document; any other upload from this session was dropped from the form and is discarded.
     */
    commit: (saved: (AssetRef | null | undefined)[]) => {
      const keep = new Set(saved.filter(Boolean).map((m) => m!.publicId));
      for (const id of keep) pending.current.delete(id);
      flush();
    },
    /** Discard everything unsaved right now (e.g. on Cancel). */
    flush,
  };
}

export type UploadSession = ReturnType<typeof useUploadSession>;

type Job = { id: string; name: string; progress: number; type: "image" | "video"; preview?: string; error?: string };

function uploadToCloudinary(file: File, sig: Record<string, string | number>, onProgress: (p: number) => void, type: "image" | "video") {
  return new Promise<Media>((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", String(sig.apiKey));
    form.append("timestamp", String(sig.timestamp));
    form.append("signature", String(sig.signature));
    form.append("folder", String(sig.folder));
    form.append("tags", String(sig.tags));
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${sig.cloudName}/${type}/upload`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      const res = JSON.parse(xhr.responseText || "{}");
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          url: res.secure_url,
          publicId: res.public_id,
          resourceType: type,
          width: res.width,
          height: res.height,
          format: res.format,
          bytes: res.bytes,
        });
      } else reject(new Error(res.error?.message || "Upload failed"));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(form);
  });
}

export default function MediaUploader({
  area,
  accept = "image",
  multiple = false,
  max = 12,
  value,
  onChange,
  session,
  label,
  hint,
}: {
  area: Area;
  accept?: "image" | "video" | "both";
  multiple?: boolean;
  max?: number;
  value: Media[];
  onChange: (next: Media[]) => void;
  session: UploadSession;
  label?: string;
  hint?: string;
}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef(value);
  latest.current = value;
  const limit = multiple ? max : 1;
  const acceptAttr = accept === "image" ? "image/*" : accept === "video" ? "video/*" : "image/*,video/*";

  const handleFiles = async (files: FileList | File[]) => {
    const list = [...files];
    const room = limit - latest.current.length - jobs.length;
    if (!multiple && latest.current.length && list.length) {
      // single mode: replacing — the old one is removed (and deleted if it was never saved)
      const old = latest.current[0];
      if (session.isPending(old.publicId)) session.discard(old);
      latest.current = [];
      onChange([]);
    } else if (list.length > room) {
      toast.error(`You can add ${Math.max(0, room)} more file${room === 1 ? "" : "s"}`);
      list.splice(Math.max(0, room));
    }

    for (const file of list.slice(0, multiple ? undefined : 1)) {
      const type: "image" | "video" | null = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : null;
      if (!type || (accept !== "both" && accept !== type)) {
        toast.error(`${file.name}: unsupported file type`);
        continue;
      }
      if (file.size > LIMITS[type]) {
        toast.error(`${file.name} is ${formatBytes(file.size)} — max ${formatBytes(LIMITS[type])}`);
        continue;
      }
      const id = `${file.name}-${Date.now()}-${Math.random()}`;
      const preview = type === "image" ? URL.createObjectURL(file) : undefined;
      setJobs((j) => [...j, { id, name: file.name, progress: 0, type, preview }]);
      try {
        const sig = await api<Record<string, string | number>>("/api/admin/uploads/sign", { method: "POST", json: { area } });
        const media = await uploadToCloudinary(file, sig, (p) => setJobs((j) => j.map((x) => (x.id === id ? { ...x, progress: p } : x))), type);
        session.track(media);
        const next = multiple ? [...latest.current, media] : [media];
        latest.current = next;
        onChange(next);
        setJobs((j) => j.filter((x) => x.id !== id));
      } catch (err) {
        setJobs((j) => j.map((x) => (x.id === id ? { ...x, error: (err as Error).message } : x)));
        setTimeout(() => setJobs((j) => j.filter((x) => x.id !== id)), 4000);
      } finally {
        if (preview) setTimeout(() => URL.revokeObjectURL(preview), 5000);
      }
    }
  };

  const remove = (m: Media) => {
    if (session.isPending(m.publicId)) {
      session.discard(m);
      toast("Upload removed from Cloudinary");
    } else {
      toast("Will be permanently deleted from Cloudinary when you save", { icon: <TriangleAlert className="h-4 w-4 text-ember" /> });
    }
    onChange(value.filter((v) => v.publicId !== m.publicId));
  };

  const makeCover = (m: Media) => onChange([m, ...value.filter((v) => v.publicId !== m.publicId)]);
  const canAdd = value.length + jobs.length < limit || !multiple;

  const tile = (m: Media, i: number) => (
    <div className="group relative h-full w-full overflow-hidden rounded-2xl border border-line bg-ink-3">
      {m.resourceType === "video" ? (
        <>
          <Image src={cldPoster(m.url, 400)} alt="" fill sizes="200px" className="object-cover" />
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-ink/80 px-2 py-0.5 font-mono text-[10px]">
            <Film className="h-3 w-3" /> Video
          </span>
        </>
      ) : (
        <Image src={m.url} alt="" fill sizes="200px" className="object-cover" />
      )}
      {multiple && i === 0 && <span className="absolute left-2 top-2 rounded-full bg-volt px-2 py-0.5 font-mono text-[10px] font-bold text-ink">Cover</span>}
      {session.isPending(m.publicId) && <span className="absolute bottom-2 left-2 rounded-full bg-ember px-2 py-0.5 font-mono text-[9px] font-bold text-ink">Unsaved</span>}
      <div className="absolute inset-0 flex items-start justify-end gap-1 bg-gradient-to-b from-ink/70 via-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
        {multiple && i > 0 && (
          <button type="button" onClick={() => makeCover(m)} className="rounded-lg bg-ink/80 p-1.5 hover:bg-volt hover:text-ink" title="Make cover">
            <Star className="h-3.5 w-3.5" />
          </button>
        )}
        <button type="button" onClick={() => remove(m)} className="rounded-lg bg-ink/80 p-1.5 hover:bg-ember hover:text-ink" title="Remove">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {multiple && <GripVertical className="absolute bottom-2 right-2 h-4 w-4 text-bone/70 opacity-0 group-hover:opacity-100" />}
    </div>
  );

  return (
    <div>
      {label && <span className="label">{label}</span>}
      <div className="flex flex-wrap gap-3">
        {multiple ? (
          <Reorder.Group axis="x" values={value} onReorder={onChange} className="flex flex-wrap gap-3">
            {value.map((m, i) => (
              <Reorder.Item key={m.publicId} value={m} className="h-28 w-28 cursor-grab active:cursor-grabbing" whileDrag={{ scale: 1.06, zIndex: 10 }}>
                {tile(m, i)}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          value[0] && <div className="h-28 w-40">{tile(value[0], 0)}</div>
        )}

        <AnimatePresence>
          {jobs.map((j) => (
            <motion.div
              key={j.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn("relative grid h-28 w-28 place-items-center overflow-hidden rounded-2xl border bg-ink-3", j.error ? "border-ember" : "border-line")}
            >
              {j.preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={j.preview} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
              )}
              {j.error ? (
                <p className="relative px-2 text-center text-[10px] text-ember">{j.error}</p>
              ) : (
                <div className="relative text-center">
                  <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#26262a" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#d7ff3a" strokeWidth="3" strokeDasharray={94.2} strokeDashoffset={94.2 - (94.2 * j.progress) / 100} strokeLinecap="round" className="transition-[stroke-dashoffset] duration-200" />
                  </svg>
                  <p className="mt-1 font-mono text-[10px]">{j.progress}%</p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {canAdd && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
            }}
            className={cn(
              "flex h-28 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 text-center text-xs transition-colors",
              multiple ? "w-28" : "w-40",
              dragging ? "border-volt bg-volt/10 text-volt" : "border-line text-mist hover:border-bone/40 hover:text-bone",
            )}
          >
            <CloudUpload className="h-6 w-6" />
            {value.length && !multiple ? "Replace" : accept === "video" ? "Add video" : accept === "both" ? "Image / video" : "Add image"}
          </button>
        )}
        <input
          ref={input}
          type="file"
          accept={acceptAttr}
          multiple={multiple}
          hidden
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {hint && <p className="mt-2 text-xs text-mist">{hint}</p>}
    </div>
  );
}
