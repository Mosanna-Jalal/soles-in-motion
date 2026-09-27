"use client";

import { useRouter } from "next/navigation";
import { LoaderCircle, LogOut, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/hooks";

type Profile = { name: string; email: string; phone?: string; address?: { line1?: string; line2?: string; city?: string; state?: string; pincode?: string } };

export function LogoutButton({ redirectTo = "/", className = "btn-ghost" }: { redirectTo?: string; className?: string }) {
  const router = useRouter();
  return (
    <button
      className={className}
      onClick={async () => {
        await api("/api/auth/logout", { method: "POST" });
        toast("Signed out");
        router.push(redirectTo);
        router.refresh();
      }}
    >
      <LogOut className="h-4 w-4" /> Sign out
    </button>
  );
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [f, setF] = useState({
    name: profile.name,
    phone: profile.phone ?? "",
    line1: profile.address?.line1 ?? "",
    line2: profile.address?.line2 ?? "",
    city: profile.address?.city ?? "",
    state: profile.address?.state ?? "",
    pincode: profile.address?.pincode ?? "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await api("/api/account", {
            method: "PATCH",
            json: { name: f.name, phone: f.phone, address: { line1: f.line1, line2: f.line2, city: f.city, state: f.state, pincode: f.pincode } },
          });
          toast.success("Profile saved");
          router.refresh();
        } catch (err) {
          toast.error((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        <span className="label">Name</span>
        <input required value={f.name} onChange={set("name")} className="field" />
      </label>
      <label>
        <span className="label">Email</span>
        <input value={profile.email} disabled className="field opacity-60" />
      </label>
      <label>
        <span className="label">Phone</span>
        <input value={f.phone} onChange={set("phone")} className="field" />
      </label>
      <label>
        <span className="label">PIN code</span>
        <input value={f.pincode} onChange={set("pincode")} className="field" inputMode="numeric" maxLength={6} />
      </label>
      <label className="sm:col-span-2">
        <span className="label">Default address</span>
        <input value={f.line1} onChange={set("line1")} className="field" placeholder="House no., street, area" />
      </label>
      <label>
        <span className="label">City</span>
        <input value={f.city} onChange={set("city")} className="field" />
      </label>
      <label>
        <span className="label">State</span>
        <input value={f.state} onChange={set("state")} className="field" />
      </label>
      <div className="sm:col-span-2">
        <button disabled={busy} className="btn-volt">
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
        </button>
      </div>
    </form>
  );
}
