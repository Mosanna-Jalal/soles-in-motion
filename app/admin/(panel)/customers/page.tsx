import { Users } from "lucide-react";
import AdminSearch from "@/components/admin/AdminSearch";
import { Empty, PageHeader } from "@/components/admin/ui";
import { connectDB } from "@/lib/db";
import { Order, User } from "@/lib/models";
import { escapeRegex, formatDate, formatINR } from "@/lib/utils";

export const metadata = { title: "Customers" };

export default async function CustomersAdmin(props: PageProps<"/admin/customers">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : "";
  await connectDB();
  const filter: Record<string, unknown> = { role: "customer" };
  if (q) filter.$or = [{ name: new RegExp(escapeRegex(q), "i") }, { email: new RegExp(escapeRegex(q), "i") }];
  const users = await User.find(filter, { name: 1, email: 1, phone: 1, createdAt: 1, lastLoginAt: 1, addresses: 1 }).sort({ createdAt: -1 }).limit(200).lean();
  const stats = await Order.aggregate<{ _id: unknown; orders: number; spent: number; last: Date }>([
    { $match: { user: { $in: users.map((u) => u._id) }, status: { $ne: "cancelled" } } },
    { $group: { _id: "$user", orders: { $sum: 1 }, spent: { $sum: "$total" }, last: { $max: "$createdAt" } } },
  ]);
  const byUser = new Map(stats.map((s) => [String(s._id), s]));
  const rows = users
    .map((u) => ({ u, s: byUser.get(String(u._id)) }))
    .sort((a, b) => (b.s?.spent ?? 0) - (a.s?.spent ?? 0));

  return (
    <>
      <PageHeader title="Customers" subtitle={`${users.length} registered customers · sorted by lifetime value`} actions={<AdminSearch placeholder="Search name or email…" />} />
      <div className="rounded-3xl border border-line bg-ink-2">
        {rows.length === 0 ? (
          <div className="p-6">
            <Empty icon={Users} title="No customers found" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead className="text-left text-xs text-mist">
                <tr className="border-b border-line">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 text-right font-medium">Orders</th>
                  <th className="px-4 py-3 text-right font-medium">Lifetime value</th>
                  <th className="px-4 py-3 font-medium">Last order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map(({ u, s }) => (
                  <tr key={String(u._id)} className="hover:bg-ink-3/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-4 font-bold text-volt">{u.name.charAt(0)}</span>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-mist">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-mist">{u.addresses?.[0]?.city ? `${u.addresses[0].city}, ${u.addresses[0].state}` : "—"}</td>
                    <td className="px-4 py-3 text-mist">{formatDate(u.createdAt as Date)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{s?.orders ?? 0}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatINR(s?.spent ?? 0)}</td>
                    <td className="px-4 py-3 text-mist">{s?.last ? formatDate(s.last) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
