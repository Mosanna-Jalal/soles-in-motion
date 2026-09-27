import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Empty, PageHeader, Pill } from "@/components/admin/ui";
import AdminSearch from "@/components/admin/AdminSearch";
import { connectDB, serialize } from "@/lib/db";
import { Order } from "@/lib/models";
import { cn, escapeRegex, formatDate, formatINR, STATUS_STYLES } from "@/lib/utils";
import type { OrderT } from "@/lib/types";

export const metadata = { title: "Orders" };

const TABS = ["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const PER_PAGE = 20;

export default async function OrdersAdmin(props: PageProps<"/admin/orders">) {
  const sp = await props.searchParams;
  const status = typeof sp.status === "string" && TABS.includes(sp.status) ? sp.status : "all";
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (status !== "all") filter.status = status;
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ orderNumber: rx }, { email: rx }, { "customer.name": rx }, { "customer.phone": rx }];
  }
  const [orders, total, counts] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * PER_PAGE).limit(PER_PAGE).lean(),
    Order.countDocuments(filter),
    Order.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);
  const list = serialize<OrderT[]>(orders);
  const count = (s: string) => (s === "all" ? counts.reduce((n, c) => n + c.n, 0) : (counts.find((c) => c._id === s)?.n ?? 0));
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const href = (patch: Record<string, string | number>) => {
    const p = new URLSearchParams({ ...(status !== "all" && { status }), ...(q && { q }), ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, String(v)])) });
    return `/admin/orders?${p}`;
  };

  return (
    <>
      <PageHeader title="Orders" subtitle={`${count("all")} orders all time`} actions={<AdminSearch placeholder="Order #, name, email, phone…" />} />
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <Link key={t} href={t === "all" ? `/admin/orders${q ? `?q=${q}` : ""}` : `/admin/orders?status=${t}${q ? `&q=${q}` : ""}`} className={cn("flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm capitalize transition-colors", status === t ? "border-volt bg-volt font-semibold text-ink" : "border-line text-mist hover:text-bone")}>
            {t}
            <span className={cn("rounded-full px-1.5 font-mono text-[10px]", status === t ? "bg-ink text-volt" : "bg-ink-3")}>{count(t)}</span>
          </Link>
        ))}
      </div>
      <div className="rounded-3xl border border-line bg-ink-2">
        {list.length === 0 ? (
          <div className="p-6">
            <Empty icon={ShoppingCart} title="No orders found" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="text-left text-xs text-mist">
                <tr className="border-b border-line">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((o) => (
                  <tr key={o._id} className="group hover:bg-ink-3/50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${o._id}`} className="font-mono text-xs font-semibold group-hover:text-volt">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-mist">{formatDate(o.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.customer.name}</p>
                      <p className="text-xs text-mist">{o.email}</p>
                    </td>
                    <td className="px-4 py-3 text-mist">{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                    <td className="px-4 py-3">
                      <span className="uppercase">{o.paymentMethod}</span> <Pill className={cn("ml-1", STATUS_STYLES[o.paymentStatus] ?? "bg-ink-4 text-mist ring-line")}>{o.paymentStatus}</Pill>
                    </td>
                    <td className="px-4 py-3">
                      <Pill className={STATUS_STYLES[o.status]}>{o.status}</Pill>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatINR(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link href={href({ page: page - 1 })} className="rounded-full border border-line px-4 py-2 hover:border-volt">
              ← Prev
            </Link>
          )}
          <span className="px-3 text-mist">
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Link href={href({ page: page + 1 })} className="rounded-full border border-line px-4 py-2 hover:border-volt">
              Next →
            </Link>
          )}
        </div>
      )}
    </>
  );
}
