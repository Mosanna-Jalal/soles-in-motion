"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, LoaderCircle, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/hooks";

export default function AdminLoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);

  return (
    <motion.form
      key={shake}
      animate={shake ? { x: [0, -12, 12, -8, 8, 0] } : undefined}
      transition={{ duration: 0.45 }}
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await api("/api/auth/login", { method: "POST", json: { email, password, scope: "admin" } });
          toast.success("Welcome back");
          router.push(next);
          router.refresh();
        } catch (err) {
          toast.error((err as Error).message);
          setShake((s) => s + 1);
          setBusy(false);
        }
      }}
    >
      <label className="relative block">
        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@solesinmotion.in" className="field pl-11" autoComplete="username" aria-label="Email" />
      </label>
      <label className="relative block">
        <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
        <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="field pl-11" autoComplete="current-password" aria-label="Password" />
      </label>
      <button disabled={busy} className="btn-volt w-full py-4">
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Enter dashboard
      </button>
    </motion.form>
  );
}
