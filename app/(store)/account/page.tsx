import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, LayoutDashboard, Package } from "lucide-react";
import { LogoutButton, ProfileForm } from "@/components/store/AccountPanels";
import { Reveal, SplitText } from "@/components/motion/primitives";
import { getSession } from "@/lib/auth";
import { connectDB, serialize } from "@/lib/db";
import { Order, User } from "@/lib/models";
import { cn, formatDate, formatINR, STATUS_STYLES } from "@/lib/utils";
import type { OrderT } from "@/lib/types";

export const metadata: Metadata = { title: "My account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");
  await connectDB();
  const [user, orders] = await Promise.all([
    User.findById(session.id, { name: 1, email: 1, phone: 1, addresses: 1, createdAt: 1 }).lean(),
    Order.find({ user: session.id }).sort({ createdAt: -1 }).limit(30).lean(),
  ]);
  if (!user) redirect("/login");
  const list = serialize<OrderT[]>(orders);
  const spent = list.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const a = user.addresses?.[0];

  return (
    <div className="container-x pb-10 pt-36 sm:pt-44">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-volt">My account</p>
          <SplitText as="h1" trigger="mount" text={`Hey, ${user.name.split(" ")[0]}`} className="display mt-3 block text-7xl sm:text-9xl" />
        </div>
        <div className="flex gap-3">
          {session.role === "admin" && (
            <Link href="/admin" className="btn-bone">
              <LayoutDashboard className="h-4 w-4" /> Admin panel
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ["Orders", String(list.length)],
          ["Total spent", formatINR(spent)],
          ["Member since", formatDate(user.createdAt as unknown as string, { month: "short", year: "numeric" })],
        ].map(([k, v], i) => (
          <Reveal key={k} delay={i * 0.08}>
            <div className="rounded-[24px] border border-line bg-ink-2 p-6">
              <p className="eyebrow text-mist">{k}</p>
              <p className="display mt-2 text-4xl">{v}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_440px]">
        <section className="rounded-[28px] border border-line bg-ink-2 p-6 sm:p-8">
          <h2 className="display text-3xl">Order history</h2>
          {list.length === 0 ? (
            <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-line py-16 text-center">
              <Package className="h-10 w-10 text-mist" />
              <p className="mt-4 text-mist">No orders yet.</p>
              <Link href="/shop" className="btn-volt mt-6">
                Start shopping
              </Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {list.map((o) => (
                <li key={o._id}>
                  <Link href={`/order/${o.orderNumber}`} className="group flex items-center gap-4 py-4">
                    <div className="flex -space-x-4">
                      {o.items.slice(0, 3).map((i, k) => (
                        <div key={k} className="relative h-14 w-14 overflow-hidden rounded-xl border-2 border-ink-2 bg-bone-2">
                          {i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-cover" />}
                        </div>
                      ))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm">{o.orderNumber}</p>
                      <p className="text-xs text-mist">
                        {formatDate(o.createdAt)} · {o.items.reduce((n, i) => n + i.qty, 0)} items
                      </p>
                    </div>
                    <span className={cn("hidden rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 sm:inline", STATUS_STYLES[o.status])}>{o.status}</span>
                    <p className="font-mono text-sm">{formatINR(o.total)}</p>
                    <ArrowUpRight className="h-4 w-4 text-mist transition-transform group-hover:rotate-45 group-hover:text-volt" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="h-fit rounded-[28px] border border-line bg-ink-2 p-6 sm:p-8">
          <h2 className="display mb-6 text-3xl">Profile</h2>
          <ProfileForm
            profile={{
              name: user.name,
              email: user.email,
              phone: user.phone ?? undefined,
              address: a ? { line1: a.line1 ?? "", line2: a.line2 ?? "", city: a.city ?? "", state: a.state ?? "", pincode: a.pincode ?? "" } : undefined,
            }}
          />
        </section>
      </div>
    </div>
  );
}
