"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Copy, Pencil, Plus, TicketPercent, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Empty, Field, Modal, Pill, Spinner, Switch, useConfirm } from "./ui";
import { api } from "@/lib/hooks";
import { cn, formatDate, formatINR } from "@/lib/utils";
import type { CouponT } from "@/lib/types";

function CouponForm({ coupon, onDone }: { coupon?: CouponT; onDone: () => void }) {
  const router = useRouter();
  const [f, setF] = useState({
    code: coupon?.code ?? "",
    description: coupon?.description ?? "",
    type: coupon?.type ?? "percent",
    value: String(coupon?.value ?? 10),
    minOrder: String(coupon?.minOrder ?? 0),
    maxUses: String(coupon?.maxUses ?? 0),
    expiresAt: coupon?.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
    active: coupon?.active ?? true,
  });
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await api(coupon ? `/api/admin/coupons/${coupon._id}` : "/api/admin/coupons", {
            method: coupon ? "PUT" : "POST",
            json: { ...f, value: Number(f.value), minOrder: Number(f.minOrder), maxUses: Number(f.maxUses), expiresAt: f.expiresAt ? new Date(`${f.expiresAt}T23:59:59`).toISOString() : null },
          });
          toast.success(coupon ? "Coupon updated" : "Coupon created");
          router.refresh();
          onDone();
        } catch (err) {
          toast.error((err as Error).message);
          setBusy(false);
        }
      }}
    >
      <Field label="Code">
        <input required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })} className="field font-mono uppercase" placeholder="SUMMER20" />
      </Field>
      <Field label="Type">
        <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as "percent" | "fixed" })} className="field">
          <option value="percent">Percentage off</option>
          <option value="fixed">Fixed amount off (₹)</option>
        </select>
      </Field>
      <Field label={f.type === "percent" ? "Discount (%)" : "Discount (₹)"}>
        <input required type="number" min={0} max={f.type === "percent" ? 90 : undefined} value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} className="field" />
      </Field>
      <Field label="Minimum order (₹)">
        <input type="number" min={0} value={f.minOrder} onChange={(e) => setF({ ...f, minOrder: e.target.value })} className="field" />
      </Field>
      <Field label="Usage limit" hint="0 = unlimited">
        <input type="number" min={0} value={f.maxUses} onChange={(e) => setF({ ...f, maxUses: e.target.value })} className="field" />
      </Field>
      <Field label="Expires on" hint="Leave empty for no expiry">
        <input type="date" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} className="field" />
      </Field>
      <Field label="Description" className="sm:col-span-2">
        <input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="field" placeholder="Shown to customers when applied" />
      </Field>
      <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3 sm:col-span-2">
        <span className="text-sm">Active</span>
        <Switch checked={f.active} onChange={(v) => setF({ ...f, active: v })} />
      </div>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <button type="button" onClick={onDone} className="btn-ghost py-2.5">
          Cancel
        </button>
        <button disabled={busy} className="btn-volt py-2.5">
          {busy && <Spinner />} Save coupon
        </button>
      </div>
    </form>
  );
}

export default function CouponManager({ coupons }: { coupons: CouponT[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<CouponT | "new" | null>(null);

  const state = (c: CouponT) => {
    if (!c.active) return ["Inactive", "bg-ink-4 text-mist ring-line"];
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) return ["Expired", "bg-ember/15 text-ember ring-ember/30"];
    if (c.maxUses && c.usedCount >= c.maxUses) return ["Used up", "bg-amber-400/15 text-amber-300 ring-amber-400/30"];
    return ["Live", "bg-volt/15 text-volt ring-volt/30"];
  };

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button onClick={() => setEditing("new")} className="btn-volt py-2.5">
          <Plus className="h-4 w-4" /> New coupon
        </button>
      </div>
      {coupons.length === 0 ? (
        <Empty icon={TicketPercent} title="No coupons yet" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {coupons.map((c, i) => {
            const [label, cls] = state(c);
            const pct = c.maxUses ? Math.min(100, (c.usedCount / c.maxUses) * 100) : 0;
            return (
              <motion.div key={c._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="relative overflow-hidden rounded-3xl border border-line bg-ink-2 p-5">
                <div className="absolute -right-6 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full border border-line bg-ink" />
                <div className="absolute -left-6 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full border border-line bg-ink" />
                <div className="flex items-start justify-between">
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(c.code);
                      toast("Code copied");
                    }}
                    className="group flex items-center gap-2 font-mono text-2xl font-bold tracking-wider hover:text-volt"
                  >
                    {c.code} <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                  </button>
                  <Pill className={cls}>{label}</Pill>
                </div>
                <p className="display mt-3 text-5xl text-volt">{c.type === "percent" ? `${c.value}% off` : `${formatINR(c.value)} off`}</p>
                <p className="mt-1 text-sm text-mist">{c.description || "—"}</p>
                <div className="my-4 border-t border-dashed border-line" />
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-mist">Min. order</dt>
                    <dd className="font-semibold">{c.minOrder ? formatINR(c.minOrder) : "None"}</dd>
                  </div>
                  <div>
                    <dt className="text-mist">Expires</dt>
                    <dd className="font-semibold">{c.expiresAt ? formatDate(c.expiresAt) : "Never"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-mist">
                      Used {c.usedCount}
                      {c.maxUses ? ` of ${c.maxUses}` : " times"}
                    </dt>
                    {c.maxUses > 0 && (
                      <div className="mt-1.5 h-1.5 rounded-full bg-ink-4">
                        <motion.div className={cn("h-full rounded-full", pct >= 100 ? "bg-ember" : "bg-volt")} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} />
                      </div>
                    )}
                  </div>
                </dl>
                <div className="mt-4 flex justify-end gap-1">
                  <button onClick={() => setEditing(c)} className="rounded-lg p-2 text-mist hover:bg-ink-4 hover:text-volt" aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (!(await confirm({ title: "Delete coupon?", danger: true, confirmLabel: "Delete", body: <>Customers will no longer be able to use <b>{c.code}</b>.</> }))) return;
                      try {
                        await api(`/api/admin/coupons/${c._id}`, { method: "DELETE" });
                        toast.success("Coupon deleted");
                        router.refresh();
                      } catch (err) {
                        toast.error((err as Error).message);
                      }
                    }}
                    className="rounded-lg p-2 text-mist hover:bg-ink-4 hover:text-ember"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "New coupon" : "Edit coupon"} wide>
        {editing && <CouponForm coupon={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />}
      </Modal>
    </>
  );
}
