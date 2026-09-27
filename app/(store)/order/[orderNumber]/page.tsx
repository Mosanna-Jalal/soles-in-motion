import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Confetti from "@/components/store/Confetti";
import OrderTimeline from "@/components/store/OrderTimeline";
import TrackForm from "@/components/store/TrackForm";
import { SplitText } from "@/components/motion/primitives";
import { connectDB, serialize } from "@/lib/db";
import { Order } from "@/lib/models";
import { getSession } from "@/lib/auth";
import { cn, formatDate, formatINR, STATUS_STYLES } from "@/lib/utils";
import type { OrderT } from "@/lib/types";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrderPage(props: PageProps<"/order/[orderNumber]">) {
  const { orderNumber } = await props.params;
  const sp = await props.searchParams;
  const token = typeof sp.t === "string" ? sp.t : undefined;
  const isNew = sp.new === "1";

  await connectDB();
  const doc = await Order.findOne({ orderNumber: orderNumber.toUpperCase() }).select("+accessToken").lean();
  if (!doc) notFound();

  const session = await getSession();
  const allowed =
    (token && token === doc.accessToken) ||
    (session && (session.role === "admin" || (doc.user && String(doc.user) === session.id)));

  if (!allowed) {
    return (
      <div className="container-x max-w-xl pb-10 pt-44">
        <h1 className="display text-6xl">Verify your order</h1>
        <p className="mt-3 text-mist">For your privacy, confirm the email address used for order {orderNumber}.</p>
        <TrackForm defaultOrder={orderNumber} className="mt-8" />
      </div>
    );
  }

  const { accessToken: _omit, ...rest } = doc;
  void _omit;
  const order = serialize<OrderT>(rest);

  return (
    <div className="container-x pb-10 pt-36 sm:pt-44">
      {isNew && <Confetti />}
      <p className="eyebrow text-volt">{isNew ? "Order confirmed" : "Order details"}</p>
      <SplitText as="h1" trigger="mount" text={isNew ? `Thank you, ${order.customer.name.split(" ")[0]}!` : `Order ${order.orderNumber}`} className="display mt-3 block text-6xl sm:text-8xl" />
      <p className="mt-4 max-w-2xl text-mist">
        {isNew
          ? `We've received your order ${order.orderNumber}. A confirmation has been sent to ${order.email}. Save this page to track your delivery.`
          : `Placed on ${formatDate(order.createdAt, { day: "numeric", month: "long", year: "numeric" })} · ${order.email}`}
      </p>

      <div className="mt-12 rounded-[28px] border border-line bg-ink-2 p-6 sm:p-10">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-sm">{order.orderNumber}</p>
          <span className={cn("rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1", STATUS_STYLES[order.status])}>{order.status}</span>
        </div>
        <OrderTimeline order={order} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="rounded-[28px] border border-line bg-ink-2 p-6 sm:p-8">
          <p className="display text-3xl">Items</p>
          <ul className="mt-4 divide-y divide-line">
            {order.items.map((i) => (
              <li key={`${i.slug}-${i.size}`} className="flex items-center gap-4 py-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-bone-2">
                  {i.image && <Image src={i.image} alt="" fill sizes="80px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${i.slug}`} className="font-semibold hover:text-volt">
                    {i.name}
                  </Link>
                  <p className="font-mono text-xs text-mist">
                    UK {i.size}
                    {i.color ? ` · ${i.color}` : ""} · Qty {i.qty}
                  </p>
                </div>
                <p className="font-mono">{formatINR(i.price * i.qty)}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-6">
          <div className="rounded-[28px] border border-line bg-ink-2 p-6">
            <p className="eyebrow text-mist">Delivering to</p>
            <p className="mt-3 font-semibold">{order.customer.name}</p>
            <p className="text-sm text-bone/75">
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
            </p>
            <p className="mt-2 text-sm text-mist">{order.customer.phone}</p>
          </div>
          <div className="rounded-[28px] border border-line bg-ink-2 p-6">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-mist">Subtotal</dt>
                <dd className="font-mono">{formatINR(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-volt">
                  <dt>Discount {order.couponCode && `(${order.couponCode})`}</dt>
                  <dd className="font-mono">−{formatINR(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-mist">Shipping</dt>
                <dd className="font-mono">{order.shipping ? formatINR(order.shipping) : "Free"}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
                <dt>Total</dt>
                <dd className="font-mono">{formatINR(order.total)}</dd>
              </div>
              <div className="flex justify-between pt-1 text-xs text-mist">
                <dt>Payment</dt>
                <dd className="uppercase">
                  {order.paymentMethod} · {order.paymentStatus}
                </dd>
              </div>
            </dl>
          </div>
          <Link href="/shop" className="btn-volt w-full">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
