"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export default function Newsletter({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      await api("/api/newsletter", { method: "POST", json: { email } });
      setState("done");
      setEmail("");
      toast.success("You're on the list", { description: "Early drops and member-only offers are coming your way." });
    } catch (err) {
      setState("idle");
      toast.error((err as Error).message);
    }
  }

  return (
    <form onSubmit={submit} className={cn("relative", className)}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-full border p-1.5 pl-5 transition-colors focus-within:border-volt",
          tone === "dark" ? "border-line bg-ink-2" : "border-ink/20 bg-bone",
        )}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          aria-label="Email address"
          className={cn("w-full bg-transparent text-sm outline-none", tone === "dark" ? "placeholder:text-mist" : "text-ink placeholder:text-ink/40")}
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors",
            tone === "dark" ? "bg-volt text-ink hover:bg-bone" : "bg-ink text-bone hover:bg-ember",
          )}
          aria-label="Subscribe"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={state} initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
              {state === "loading" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : state === "done" ? (
                <Check className="h-4 w-4" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </form>
  );
}
