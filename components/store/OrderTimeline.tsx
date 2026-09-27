"use client";

import { motion } from "motion/react";
import { Check, CircleX, Package, PackageCheck, Receipt, Truck } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { OrderT } from "@/lib/types";

const FLOW = [
  { status: "pending", label: "Order placed", icon: Receipt },
  { status: "confirmed", label: "Confirmed", icon: Check },
  { status: "processing", label: "Packed", icon: Package },
  { status: "shipped", label: "Shipped", icon: Truck },
  { status: "delivered", label: "Delivered", icon: PackageCheck },
] as const;

export default function OrderTimeline({ order }: { order: OrderT }) {
  if (order.status === "cancelled") {
    return (
      <div className="flex items-center gap-4 rounded-3xl border border-ember/40 bg-ember/10 p-6">
        <CircleX className="h-8 w-8 text-ember" />
        <div>
          <p className="font-semibold">This order was cancelled</p>
          <p className="text-sm text-mist">
            {order.paymentStatus === "refunded" ? "Your refund has been initiated to the original payment method." : "No payment was collected."}
          </p>
        </div>
      </div>
    );
  }
  const reached = FLOW.findIndex((f) => f.status === order.status);
  const at = (s: string) => order.timeline.find((t) => t.status === s)?.at;
  return (
    <ol className="relative grid grid-cols-5 gap-2">
      <div className="absolute left-[10%] right-[10%] top-6 h-[3px] rounded-full bg-ink-4" />
      <motion.div
        className="absolute left-[10%] top-6 h-[3px] rounded-full bg-volt"
        initial={{ width: 0 }}
        animate={{ width: `${(reached / (FLOW.length - 1)) * 80}%` }}
        transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
      {FLOW.map((f, i) => {
        const done = i <= reached;
        const when = at(f.status);
        return (
          <li key={f.status} className="relative flex flex-col items-center text-center">
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.15, type: "spring", stiffness: 260, damping: 18 }}
              className={cn(
                "relative z-10 grid h-12 w-12 place-items-center rounded-full border-2 transition-colors",
                done ? "border-volt bg-volt text-ink" : "border-line bg-ink-2 text-mist",
                i === reached && "ring-4 ring-volt/25",
              )}
            >
              <f.icon className="h-5 w-5" />
            </motion.span>
            <p className={cn("mt-3 text-xs font-semibold sm:text-sm", !done && "text-mist")}>{f.label}</p>
            {when && <p className="font-mono text-[10px] text-mist">{formatDate(when, { day: "numeric", month: "short" })}</p>}
          </li>
        );
      })}
    </ol>
  );
}
