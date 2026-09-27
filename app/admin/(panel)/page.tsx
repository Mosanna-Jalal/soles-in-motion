import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Package, TriangleAlert } from "lucide-react";
import { Card, PageHeader, Pill } from "@/components/admin/ui";
import { BarList, RevenueChart } from "@/components/admin/DashboardCharts";
import { getDashboard } from "@/lib/admin-data";
import { cn, formatDate, formatINR, STATUS_STYLES } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

function Kpi({ label, value, delta, note }: { label: string; value: string; delta?: number; note: string }) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className="rounded-3xl border border-line bg-ink-2 p-5">
      <p className="text-sm text-mist">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-mist">
        {delta !== undefined && (
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold", up ? "bg-volt/15 text-volt" : "bg-ember/15 text-ember")}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
        )}
        {note}
      </p>
    </div>
  );
}

export default async function Dashboard() {
  const d = await getDashboard(30);
  const statusOrder = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
  const byStatus = statusOrder.map((s) => ({ label: s, value: d.byStatus.find((b) => b.status === s)?.count ?? 0 }));
  const paymentLabel: Record<string, string> = { cod: "Cash on delivery", upi: "UPI", card: "Card" };

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Performance over the last 30 days, compared with the 30 days before." actions={<Link href="/admin/products/new" className="btn-volt py-2.5">+ New product</Link>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Revenue" value={formatINR(d.kpis.revenue)} delta={d.kpis.revenueDelta} note="vs previous 30 days" />
        <Kpi label="Orders" value={d.kpis.orders.toLocaleString("en-IN")} delta={d.kpis.ordersDelta} note={`${d.kpis.items} pairs sold`} />
        <Kpi label="Average order value" value={formatINR(d.kpis.aov)} delta={d.kpis.aovDelta} note="vs previous 30 days" />
        <Kpi label="Customers" value={d.kpis.customers.toLocaleString("en-IN")} note={`${d.kpis.products} products in catalogue`} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Daily revenue" className="xl:col-span-2">
          <RevenueChart data={d.series} />
        </Card>
        <Card title="Orders by status" action={<Link href="/admin/orders" className="text-xs text-mist hover:text-volt">All orders →</Link>}>
          <BarList rows={byStatus} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Revenue by collection">
          {d.byCategory.length ? <BarList rows={d.byCategory.map((c) => ({ label: c.name, value: c.revenue }))} unit="inr" /> : <p className="text-sm text-mist">No sales yet.</p>}
        </Card>
        <Card title="Top products (30 days)">
          <ul className="space-y-3">
            {d.topProducts.map((p, i) => (
              <li key={p._id} className="flex items-center gap-3">
                <span className="w-4 font-mono text-xs text-mist">{i + 1}</span>
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-bone-2">{p.image && <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-mist">{p.qty} sold</p>
                </div>
                <p className="text-sm tabular-nums">{formatINR(p.revenue)}</p>
              </li>
            ))}
            {!d.topProducts.length && <p className="text-sm text-mist">No sales in this period.</p>}
          </ul>
        </Card>
        <Card title="Payment methods">
          <BarList rows={d.byPayment.map((p) => ({ label: paymentLabel[p.method] ?? p.method, value: p.count, extra: formatINR(p.revenue) }))} unit="orders" />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Recent orders" className="xl:col-span-2" action={<Link href="/admin/orders" className="text-xs text-mist hover:text-volt">View all →</Link>}>
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs text-mist">
                <tr>
                  <th className="px-2 pb-3 font-medium">Order</th>
                  <th className="px-2 pb-3 font-medium">Customer</th>
                  <th className="px-2 pb-3 font-medium">Date</th>
                  <th className="px-2 pb-3 font-medium">Status</th>
                  <th className="px-2 pb-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {d.recent.map((o) => (
                  <tr key={o._id} className="group">
                    <td className="px-2 py-3">
                      <Link href={`/admin/orders/${o._id}`} className="font-mono text-xs group-hover:text-volt">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-2 py-3">{o.customer.name}</td>
                    <td className="px-2 py-3 text-mist">{formatDate(o.createdAt, { day: "numeric", month: "short" })}</td>
                    <td className="px-2 py-3">
                      <Pill className={STATUS_STYLES[o.status]}>{o.status}</Pill>
                    </td>
                    <td className="px-2 py-3 text-right tabular-nums">{formatINR(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Low stock" action={<TriangleAlert className="h-4 w-4 text-ember" />}>
          <ul className="space-y-3">
            {d.lowStock.map((p) => (
              <li key={p._id}>
                <Link href={`/admin/products/${p._id}`} className="group flex items-center gap-3">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-bone-2">{p.image && <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold group-hover:text-volt">{p.name}</p>
                    <p className="text-xs text-mist">{p.out ? `${p.out} size${p.out > 1 ? "s" : ""} sold out` : "Running low"}</p>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", p.stock <= 10 ? "bg-ember/15 text-ember" : "bg-amber-400/15 text-amber-300")}>{p.stock} left</span>
                </Link>
              </li>
            ))}
            {!d.lowStock.length && (
              <p className="flex items-center gap-2 text-sm text-mist">
                <Package className="h-4 w-4" /> All products are well stocked.
              </p>
            )}
          </ul>
        </Card>
      </div>
    </>
  );
}
