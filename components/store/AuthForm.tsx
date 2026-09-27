"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/hooks";

export default function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  return (
    <motion.form
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await api(`/api/auth/${mode}`, { method: "POST", json: mode === "login" ? { email: form.email, password: form.password } : form });
          toast.success(mode === "login" ? "Welcome back!" : "Account created — welcome to the movement!");
          router.push(safeNext);
          router.refresh();
        } catch (err) {
          toast.error((err as Error).message);
          setBusy(false);
        }
      }}
    >
      {mode === "register" && (
        <label className="block">
          <span className="label">Full name</span>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" autoComplete="name" />
        </label>
      )}
      <label className="block">
        <span className="label">Email</span>
        <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field" autoComplete="email" />
      </label>
      <label className="block">
        <span className="label">Password</span>
        <span className="relative block">
          <input
            required
            type={show ? "text" : "password"}
            minLength={mode === "register" ? 8 : 1}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="field pr-12"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-mist hover:text-bone" aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </span>
        {mode === "register" && <span className="mt-1.5 block text-xs text-mist">At least 8 characters.</span>}
      </label>
      <button disabled={busy} className="btn-volt w-full py-4">
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {mode === "login" ? "Sign in" : "Create account"}
      </button>
      <p className="text-center text-sm text-mist">
        {mode === "login" ? "New here? " : "Already have an account? "}
        <Link href={`/${mode === "login" ? "register" : "login"}${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-bone underline underline-offset-4 hover:text-volt">
          {mode === "login" ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </motion.form>
  );
}
