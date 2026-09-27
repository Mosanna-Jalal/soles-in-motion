"use client";

import { motion } from "motion/react";
import { formatINR } from "@/lib/utils";
import type { Totals } from "@/lib/pricing";

export default function OrderSummary({ totals, couponCode }: { totals: Totals; couponCode?: string }) {
  const rows: [string, string, string?][] = [
    ["Subtotal", formatINR(totals.subtotal)],
    ...(totals.discount ? ([[`Discount${couponCode ? ` (${couponCode})` : ""}`, `−${formatINR(totals.discount)}`, "text-volt"]] as [string, string, string][]) : []),
    ["Shipping", totals.shipping ? formatINR(totals.shipping) : "Free", totals.shipping ? undefined : "text-volt"],
  ];
  return (
    <dl className="space-y-3 text-sm">
      {rows.map(([k, v, cls]) => (
        <div key={k} className="flex justify-between">
          <dt className="text-mist">{k}</dt>
          <dd className={`font-mono ${cls ?? ""}`}>{v}</dd>
        </div>
      ))}
      <div className="flex items-end justify-between border-t border-line pt-4">
        <dt className="font-semibold">Total</dt>
        <dd>
          <motion.span key={totals.total} initial={{ opacity: 0.4, y: -6 }} animate={{ opacity: 1, y: 0 }} className="display block text-4xl">
            {formatINR(totals.total)}
          </motion.span>
        </dd>
      </div>
      <p className="text-right text-xs text-mist">Includes {formatINR(totals.tax)} GST</p>
    </dl>
  );
}
