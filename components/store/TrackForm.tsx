"use client";

import { useRouter } from "next/navigation";
import { LoaderCircle, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export default function TrackForm({ defaultOrder = "", className }: { defaultOrder?: string; className?: string }) {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState(defaultOrder);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className={cn("grid gap-4", className)}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const { url } = await api<{ url: string }>("/api/orders/track", { method: "POST", json: { orderNumber, email } });
          router.push(url);
        } catch (err) {
          toast.error((err as Error).message);
          setBusy(false);
        }
      }}
    >
      <label>
        <span className="label">Order number</span>
        <input required value={orderNumber} onChange={(e) => setOrderNumber(e.target.value.toUpperCase())} placeholder="SIM-260927-A1B2C3" className="field font-mono" />
      </label>
      <label>
        <span className="label">Email used at checkout</span>
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
      </label>
      <button disabled={busy} className="btn-volt">
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Track order
      </button>
    </form>
  );
}
