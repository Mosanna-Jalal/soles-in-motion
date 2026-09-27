"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Spinner, useConfirm } from "./ui";
import { api } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

const FLOW: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];

export default function OrderActions({ id, status, paymentStatus }: { id: string; status: OrderStatus; paymentStatus: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const closed = status === "cancelled" || status === "delivered";

  const update = async (json: Record<string, string>, label: string) => {
    setBusy(label);
    try {
      await api(`/api/admin/orders/${id}`, { method: "PATCH", json: { ...json, ...(note && { note }) } });
      toast.success("Order updated");
      setNote("");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const idx = FLOW.indexOf(status);

  return (
    <Card title="Fulfilment">
      <div className="space-y-2">
        {FLOW.map((s, i) => {
          const done = idx >= i && status !== "cancelled";
          const next = i === idx + 1 && !closed;
          return (
            <button
              key={s}
              disabled={!next || !!busy}
              onClick={() => update({ status: s }, s)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm capitalize transition-colors",
                done ? "border-volt/40 bg-volt/10" : next ? "border-line hover:border-volt hover:bg-ink-3" : "border-line opacity-40",
              )}
            >
              <span className={cn("grid h-6 w-6 place-items-center rounded-full", done ? "bg-volt text-ink" : "border border-line")}>{busy === s ? <Spinner className="h-3.5 w-3.5" /> : done ? <Check className="h-3.5 w-3.5" /> : null}</span>
              <span className="flex-1 font-semibold">{s}</span>
              {next && <span className="font-mono text-[10px] uppercase tracking-widest text-volt">Mark</span>}
            </button>
          );
        })}
      </div>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Optional note for the timeline (e.g. AWB number)…" className="field mt-4 resize-none text-sm" />
      <div className="mt-3 flex flex-wrap gap-2">
        {note && (
          <button disabled={!!busy} onClick={() => update({}, "note")} className="btn-ghost py-2 text-xs">
            Add note
          </button>
        )}
        {paymentStatus === "pending" && status !== "cancelled" && (
          <button disabled={!!busy} onClick={() => update({ paymentStatus: "paid" }, "paid")} className="btn-ghost py-2 text-xs">
            Mark as paid
          </button>
        )}
        {status !== "cancelled" && status !== "delivered" && (
          <button
            disabled={!!busy}
            onClick={async () => {
              const ok = await confirm({ title: "Cancel this order?", danger: true, confirmLabel: "Cancel order", body: "Stock for every item will be returned to inventory. Prepaid orders are marked as refunded." });
              if (ok) update({ status: "cancelled" }, "cancel");
            }}
            className="btn border border-ember/40 py-2 text-xs text-ember hover:bg-ember hover:text-ink"
          >
            {busy === "cancel" && <Spinner />} Cancel order
          </button>
        )}
      </div>
    </Card>
  );
}
