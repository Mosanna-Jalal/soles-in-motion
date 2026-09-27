import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { Card, Pill } from "@/components/admin/ui";
import OrderActions from "@/components/admin/OrderActions";
import { connectDB, serialize } from "@/lib/db";
import { Order } from "@/lib/models";
import { cn, formatDate, formatINR, STATUS_STYLES } from "@/lib/utils";
import type { OrderT } from "@/lib/types";

export const metadata = { title: "Order" };

export default async function OrderAdmin(props: PageProps<"/admin/orders/[id]">) {
  const { id } = await props.params;
  if (!/^[a-f0-9]{24}$/i.test(id)) notFound();
  await connectDB();
  const doc = await Order.findById(id).lean();
  if (!doc) notFound();
  const o = serialize<OrderT>(doc);

  return (
    <>
      <Link href="/admin/orders" className="mb-2 inline-flex items-center gap-1 text-sm text-mist hover:text-volt">
        <ArrowLeft className="h-4 w-4" /> Orders
      </Link>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl sm:text-5xl">{o.orderNumber}</h1>
          <p className="mt-2 text-sm text-mist">Placed {formatDate(o.createdAt, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        <div className="flex gap-2">
          <Pill className={STATUS_STYLES[o.status]}>{o.status}</Pill>
          <Pill className={STATUS_STYLES[o.paymentStatus] ?? "bg-ink-4 text-mist ring-line"}>{o.paymentStatus}</Pill>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card title={`Items (${o.items.reduce((n, i) => n + i.qty, 0)})`}>
            <ul className="divide-y divide-line">
              {o.items.map((i) => (
                <li key={`${i.slug}-${i.size}`} className="flex items-center gap-4 py-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-bone-2">{i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-cover" />}</div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${i.slug}`} target="_blank" className="font-semibold hover:text-volt">
                      {i.name}
                    </Link>
                    <p className="font-mono text-xs text-mist">
                      UK {i.size}
                      {i.color ? ` · ${i.color}` : ""}
                    </p>
                  </div>
                  <p className="text-sm text-mist">
                    {formatINR(i.price)} × {i.qty}
                  </p>
                  <p className="w-24 text-right font-semibold tabular-nums">{formatINR(i.price * i.qty)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-mist">Subtotal</dt>
                <dd className="tabular-nums">{formatINR(o.subtotal)}</dd>
              </div>
              {o.discount > 0 && (
                <div className="flex justify-between text-volt">
                  <dt>Discount {o.couponCode && `(${o.couponCode})`}</dt>
                  <dd className="tabular-nums">−{formatINR(o.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-mist">Shipping</dt>
                <dd className="tabular-nums">{o.shipping ? formatINR(o.shipping) : "Free"}</dd>
              </div>
              <div className="flex justify-between text-mist">
                <dt>GST (included)</dt>
                <dd className="tabular-nums">{formatINR(o.tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-lg font-bold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatINR(o.total)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Timeline">
            <ol className="relative space-y-5 border-l border-line pl-6">
              {[...o.timeline].reverse().map((t, i) => (
                <li key={i} className="relative">
                  <span className={cn("absolute -left-[31px] top-1 h-3 w-3 rounded-full ring-4 ring-ink-2", i === 0 ? "bg-volt" : "bg-ink-4")} />
                  <p className="text-sm font-semibold capitalize">{t.status}</p>
                  {t.note && <p className="text-sm text-bone/75">{t.note}</p>}
                  <p className="text-xs text-mist">{formatDate(t.at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-4">
          <OrderActions id={o._id} status={o.status} paymentStatus={o.paymentStatus} />
          <Card title="Customer">
            <p className="font-semibold">{o.customer.name}</p>
            <div className="mt-3 space-y-2 text-sm text-bone/80">
              <a href={`mailto:${o.email}`} className="flex items-center gap-2 hover:text-volt">
                <Mail className="h-4 w-4 text-mist" /> {o.email}
              </a>
              <a href={`tel:${o.customer.phone}`} className="flex items-center gap-2 hover:text-volt">
                <Phone className="h-4 w-4 text-mist" /> {o.customer.phone}
              </a>
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-mist" />
                <span>
                  {o.shippingAddress.line1}
                  {o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ""}
                  <br />
                  {o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.pincode}
                </span>
              </p>
            </div>
            <p className="mt-4 text-xs text-mist">
              {o.user ? "Registered customer" : "Guest checkout"} · Paid via <span className="uppercase">{o.paymentMethod}</span>
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
