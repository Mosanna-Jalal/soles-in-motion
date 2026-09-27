"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion } from "motion/react";
import { useState } from "react";
import { formatINR } from "@/lib/utils";

const ACCENT = "#d7ff3a";
const GRID = "#26262a";
const MUTED = "#8e8b85";

function compactINR(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(v >= 1000000 ? 0 : 1)}L`;
  if (v >= 1000) return `₹${Math.round(v / 1000)}K`;
  return `₹${v}`;
}

type Point = { date: string; revenue: number; orders: number };

export function RevenueChart({ data }: { data: Point[] }) {
  const [table, setTable] = useState(false);
  const peak = data.reduce((m, d) => (d.revenue > m.revenue ? d : m), data[0] ?? { date: "", revenue: 0, orders: 0 });
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-mist">
        <span>
          Peak day: <b className="text-bone">{peak.date ? new Date(peak.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</b> ·{" "}
          {formatINR(peak.revenue)}
        </span>
        <button onClick={() => setTable((t) => !t)} className="rounded-full border border-line px-3 py-1 hover:border-volt hover:text-volt">
          {table ? "Chart view" : "Table view"}
        </button>
      </div>
      {table ? (
        <div className="thin-scroll max-h-72 overflow-y-auto rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-ink-3 text-left text-xs text-mist">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 text-right font-medium">Orders</th>
                <th className="px-4 py-2 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...data].reverse().map((d) => (
                <tr key={d.date}>
                  <td className="px-4 py-2">{d.date}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{d.orders}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatINR(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACCENT} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={ACCENT} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID} strokeWidth={1} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={{ stroke: GRID }}
                tick={{ fill: MUTED, fontSize: 11 }}
                tickFormatter={(d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                minTickGap={24}
              />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: MUTED, fontSize: 11 }} tickFormatter={compactINR} width={56} />
              <Tooltip
                cursor={{ stroke: MUTED, strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as Point;
                  return (
                    <div className="rounded-xl border border-line bg-ink-3 px-3 py-2 text-xs shadow-xl">
                      <p className="text-mist">{new Date(p.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</p>
                      <p className="mt-1 flex items-center gap-2 font-semibold text-bone">
                        <span className="h-2 w-2 rounded-full" style={{ background: ACCENT }} /> {formatINR(p.revenue)}
                      </p>
                      <p className="text-mist">{p.orders} orders</p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={ACCENT}
                strokeWidth={2}
                fill="url(#rev)"
                activeDot={{ r: 5, fill: ACCENT, stroke: "#121214", strokeWidth: 2 }}
                animationDuration={1400}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/** Horizontal magnitude bars — single hue, value at the tip, tooltip-free because every value is labelled. */
export function BarList({ rows, unit = "count" }: { rows: { label: string; value: number; extra?: string }[]; unit?: "count" | "inr" | "orders" }) {
  const format = (v: number) => (unit === "inr" ? formatINR(v) : unit === "orders" ? `${v} orders` : v.toLocaleString("en-IN"));
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3.5">
      {rows.map((r, i) => (
        <li key={r.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="capitalize text-bone/85">{r.label}</span>
            <span className="tabular-nums text-bone">
              {format(r.value)}
              {r.extra && <span className="ml-2 text-xs text-mist">{r.extra}</span>}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-ink-3">
            <motion.div
              className="h-full rounded-full"
              style={{ background: ACCENT }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(2, (r.value / max) * 100)}%` }}
              transition={{ duration: 1, delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
