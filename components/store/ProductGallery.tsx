"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Play } from "lucide-react";
import { useRef, useState } from "react";
import { cldPoster, cldVideo } from "@/lib/cld";
import { cn } from "@/lib/utils";
import type { Media } from "@/lib/types";

export default function ProductGallery({ images, video, name }: { images: Media[]; video?: Media | null; name: string }) {
  const slides: Media[] = [...images, ...(video ? [video] : [])];
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const current = slides[index];

  if (!current) {
    return <div className="aspect-square rounded-[28px] bg-ink-3" />;
  }

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row">
      <div className="no-scrollbar flex gap-3 overflow-x-auto lg:max-h-[640px] lg:flex-col lg:overflow-y-auto">
        {slides.map((m, i) => (
          <button
            key={m.publicId}
            onClick={() => setIndex(i)}
            aria-label={`Show ${m.resourceType} ${i + 1}`}
            className={cn(
              "relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 bg-bone-2 transition-all lg:h-24 lg:w-24",
              i === index ? "border-volt" : "border-transparent opacity-60 hover:opacity-100",
            )}
          >
            <Image
              src={m.resourceType === "video" ? cldPoster(m.url, 300) : m.url}
              alt=""
              fill
              sizes="96px"
              className="object-cover"
            />
            {m.resourceType === "video" && (
              <span className="absolute inset-0 grid place-items-center bg-ink/40">
                <Play className="h-6 w-6 fill-bone" />
              </span>
            )}
          </button>
        ))}
      </div>

      <div
        ref={stage}
        className="relative aspect-square flex-1 overflow-hidden rounded-[28px] bg-bone-2"
        data-cursor={current.resourceType === "image" ? "Zoom" : undefined}
        onPointerMove={(e) => {
          if (current.resourceType !== "image" || e.pointerType !== "mouse") return;
          const r = stage.current!.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onPointerLeave={() => setZoom(null)}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={current.publicId}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.08, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {current.resourceType === "video" ? (
              <video
                src={cldVideo(current.url, 1200)}
                poster={cldPoster(current.url, 1200)}
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                controls
              />
            ) : (
              <Image
                src={current.url}
                alt={current.alt || name}
                fill
                priority={index === 0}
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover transition-transform duration-300 ease-out"
                style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
              />
            )}
          </motion.div>
        </AnimatePresence>
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-ink/70 px-3 py-1 font-mono text-[10px] uppercase tracking-widest backdrop-blur">
          {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </div>
      </div>
    </div>
  );
}
