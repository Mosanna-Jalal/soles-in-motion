"use client";

import { AnimatePresence, motion } from "motion/react";
import { CircleCheck, LoaderCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/hooks";

export default function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", subject: "", message: "" });
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <AnimatePresence mode="wait">
      {state === "sent" ? (
        <motion.div key="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid place-items-center py-16 text-center">
          <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}>
            <CircleCheck className="h-16 w-16 text-volt" />
          </motion.span>
          <p className="display mt-6 text-5xl">Message sent</p>
          <p className="mt-2 text-mist">We usually reply within a few hours.</p>
          <button onClick={() => setState("idle")} className="btn-ghost mt-8">
            Send another
          </button>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          exit={{ opacity: 0, y: -20 }}
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setState("busy");
            try {
              await api("/api/contact", { method: "POST", json: f });
              setF({ name: "", email: "", subject: "", message: "" });
              setState("sent");
            } catch (err) {
              toast.error((err as Error).message);
              setState("idle");
            }
          }}
        >
          <label>
            <span className="label">Name</span>
            <input required value={f.name} onChange={set("name")} className="field" />
          </label>
          <label>
            <span className="label">Email</span>
            <input required type="email" value={f.email} onChange={set("email")} className="field" />
          </label>
          <label className="sm:col-span-2">
            <span className="label">Subject</span>
            <input value={f.subject} onChange={set("subject")} className="field" placeholder="Order, sizing, store visit…" />
          </label>
          <label className="sm:col-span-2">
            <span className="label">Message</span>
            <textarea required minLength={10} rows={6} value={f.message} onChange={set("message")} className="field resize-none" />
          </label>
          <div className="sm:col-span-2">
            <button disabled={state === "busy"} className="btn-volt">
              {state === "busy" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send message
            </button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
