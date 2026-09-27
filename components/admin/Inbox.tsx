"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Download, Inbox as InboxIcon, Mail, MailOpen, Reply, Trash2, UserMinus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Empty, useConfirm } from "./ui";
import { api } from "@/lib/hooks";
import { cn, formatDate } from "@/lib/utils";

type Msg = { _id: string; name: string; email: string; subject?: string; message: string; read: boolean; createdAt: string };
type Sub = { _id: string; email: string; createdAt: string };

export default function Inbox({ messages, subscribers }: { messages: Msg[]; subscribers: Sub[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [openId, setOpenId] = useState<string | null>(messages.find((m) => !m.read)?._id ?? messages[0]?._id ?? null);
  const open = messages.find((m) => m._id === openId) ?? null;

  const markRead = async (m: Msg, read: boolean) => {
    await api(`/api/admin/messages/${m._id}`, { method: "PATCH", json: { read } }).catch(() => {});
    router.refresh();
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <Card className="p-0 sm:p-0">
        {messages.length === 0 ? (
          <div className="p-6">
            <Empty icon={InboxIcon} title="Inbox zero">
              Messages from the contact form will appear here.
            </Empty>
          </div>
        ) : (
          <div className="grid md:grid-cols-[300px_1fr]">
            <ul className="thin-scroll max-h-[640px] divide-y divide-line overflow-y-auto border-b border-line md:border-b-0 md:border-r">
              {messages.map((m) => (
                <li key={m._id}>
                  <button
                    onClick={() => {
                      setOpenId(m._id);
                      if (!m.read) markRead(m, true);
                    }}
                    className={cn("w-full px-5 py-4 text-left transition-colors", openId === m._id ? "bg-ink-3" : "hover:bg-ink-3/50")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("truncate text-sm", m.read ? "text-bone/70" : "font-bold")}>{m.name}</p>
                      {!m.read && <span className="h-2 w-2 shrink-0 rounded-full bg-volt" />}
                    </div>
                    <p className="truncate text-xs text-bone/70">{m.subject || "(no subject)"}</p>
                    <p className="mt-1 text-[11px] text-mist">{formatDate(m.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  </button>
                </li>
              ))}
            </ul>
            <AnimatePresence mode="wait">
              {open && (
                <motion.article key={open._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold">{open.subject || "(no subject)"}</h2>
                      <p className="mt-1 text-sm text-mist">
                        {open.name} · <a href={`mailto:${open.email}`} className="hover:text-volt">{open.email}</a>
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => markRead(open, !open.read)} className="rounded-lg p-2 text-mist hover:bg-ink-4 hover:text-bone" title={open.read ? "Mark unread" : "Mark read"}>
                        {open.read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={async () => {
                          if (!(await confirm({ title: "Delete message?", danger: true, confirmLabel: "Delete", body: `The message from ${open.name} will be permanently deleted.` }))) return;
                          await api(`/api/admin/messages/${open._id}`, { method: "DELETE" });
                          toast.success("Message deleted");
                          setOpenId(null);
                          router.refresh();
                        }}
                        className="rounded-lg p-2 text-mist hover:bg-ink-4 hover:text-ember"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-6 whitespace-pre-line leading-relaxed text-bone/85">{open.message}</p>
                  <a href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject || "Your message"}`)}`} className="btn-volt mt-8 py-2.5">
                    <Reply className="h-4 w-4" /> Reply by email
                  </a>
                </motion.article>
              )}
            </AnimatePresence>
          </div>
        )}
      </Card>

      <Card
        title={`Newsletter (${subscribers.length})`}
        action={
          <a href="/api/admin/subscribers" className="flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs hover:border-volt hover:text-volt">
            <Download className="h-3.5 w-3.5" /> CSV
          </a>
        }
      >
        <ul className="thin-scroll max-h-[560px] space-y-1 overflow-y-auto">
          {subscribers.map((s) => (
            <li key={s._id} className="group flex items-center justify-between gap-2 rounded-xl px-2 py-2 hover:bg-ink-3">
              <div className="min-w-0">
                <p className="truncate text-sm">{s.email}</p>
                <p className="text-[11px] text-mist">{formatDate(s.createdAt)}</p>
              </div>
              <button
                onClick={async () => {
                  await api("/api/admin/subscribers", { method: "DELETE", json: { id: s._id } });
                  toast("Unsubscribed");
                  router.refresh();
                }}
                className="rounded-lg p-1.5 text-mist opacity-0 hover:text-ember group-hover:opacity-100"
                title="Remove"
              >
                <UserMinus className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
