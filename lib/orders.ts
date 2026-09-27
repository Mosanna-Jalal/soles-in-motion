import { randomBytes } from "crypto";
import { Types } from "mongoose";
import type { z } from "zod";
import { connectDB } from "./db";
import { Coupon, Order, Product, Review, User } from "./models";
import { ApiError } from "./api";
import { computeTotals, couponDiscount } from "./pricing";
import { getSettings } from "./data";
import type { orderInput } from "./validators";
import type { SessionUser } from "./types";

export function generateOrderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `SIM-${ymd}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function validateCoupon(code: string, subtotal: number) {
  await connectDB();
  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), active: true }).lean();
  if (!coupon) throw new ApiError(404, "That code isn't valid");
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) throw new ApiError(410, "That code has expired");
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) throw new ApiError(410, "That code has reached its usage limit");
  if (subtotal < coupon.minOrder) {
    throw new ApiError(422, `Add ₹${(coupon.minOrder - subtotal).toLocaleString("en-IN")} more to use ${coupon.code}`);
  }
  const discount = couponDiscount({ type: coupon.type as "percent" | "fixed", value: coupon.value }, subtotal);
  return { coupon, discount };
}

type Line = {
  product: unknown;
  name: string;
  slug: string;
  image?: string;
  size: string;
  color?: string;
  price: number;
  qty: number;
};

async function releaseStock(lines: Pick<Line, "product" | "size" | "qty">[]) {
  await Promise.all(
    lines.map((l) =>
      Product.updateOne({ _id: l.product, "sizes.size": l.size }, { $inc: { "sizes.$.stock": l.qty, soldCount: -l.qty } }),
    ),
  );
}

export async function createOrder(input: z.infer<typeof orderInput>, session: SessionUser | null) {
  await connectDB();
  const settings = await getSettings();

  // Merge duplicate lines (same product + size) and load authoritative prices.
  const merged = new Map<string, (typeof input.items)[number]>();
  for (const item of input.items) {
    const key = `${item.productId}:${item.size}`;
    const prev = merged.get(key);
    merged.set(key, prev ? { ...prev, qty: Math.min(10, prev.qty + item.qty) } : item);
  }
  const items = [...merged.values()];
  const products = await Product.find({ _id: { $in: items.map((i) => i.productId) }, active: true }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const lines: Line[] = items.map((i) => {
    const p = byId.get(i.productId);
    if (!p) throw new ApiError(409, "A product in your bag is no longer available");
    if (!p.sizes.some((s) => s.size === i.size)) throw new ApiError(409, `${p.name} is not available in UK ${i.size}`);
    return {
      product: p._id,
      name: p.name,
      slug: p.slug,
      image: p.images?.[0]?.url,
      size: i.size,
      color: i.color ?? p.colors?.[0]?.name ?? undefined,
      price: p.price,
      qty: i.qty,
    };
  });

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  let discount = 0;
  let couponCode: string | null = null;
  if (input.couponCode) {
    const res = await validateCoupon(input.couponCode, subtotal);
    discount = res.discount;
    couponCode = res.coupon.code;
  }
  const totals = computeTotals(subtotal, discount, settings);

  // Reserve stock atomically per line; roll back everything on the first failure.
  const reserved: Line[] = [];
  try {
    for (const l of lines) {
      const r = await Product.updateOne(
        { _id: l.product, sizes: { $elemMatch: { size: l.size, stock: { $gte: l.qty } } } },
        { $inc: { "sizes.$.stock": -l.qty, soldCount: l.qty } },
      );
      if (r.modifiedCount !== 1) {
        throw new ApiError(409, `Sorry — ${l.name} (UK ${l.size}) has fewer pairs left than you requested.`);
      }
      reserved.push(l);
    }
    if (couponCode) {
      const r = await Coupon.updateOne(
        { code: couponCode, $or: [{ maxUses: 0 }, { $expr: { $lt: ["$usedCount", "$maxUses"] } }] },
        { $inc: { usedCount: 1 } },
      );
      if (r.modifiedCount !== 1) throw new ApiError(409, "That code just reached its usage limit");
    }
  } catch (err) {
    await releaseStock(reserved);
    throw err;
  }

  const prepaid = input.paymentMethod !== "cod";
  const accessToken = randomBytes(16).toString("hex");
  const now = new Date();

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const order = await Order.create({
        orderNumber: generateOrderNumber(),
        user: session?.id ?? null,
        email: input.email,
        customer: input.customer,
        shippingAddress: input.shippingAddress,
        items: lines,
        ...totals,
        couponCode,
        paymentMethod: input.paymentMethod,
        paymentStatus: prepaid ? "paid" : "pending",
        status: prepaid ? "confirmed" : "pending",
        timeline: [
          { status: "pending", note: "Order placed", at: now },
          ...(prepaid ? [{ status: "confirmed", note: "Payment received", at: now }] : []),
        ],
        accessToken,
      });
      if (session) {
        // Remember the first shipping address so the next checkout is pre-filled.
        await User.updateOne(
          { _id: session.id, "addresses.0": { $exists: false } },
          { $set: { addresses: [{ label: "Home", ...input.shippingAddress }], phone: input.customer.phone } },
        );
      }
      return { orderNumber: order.orderNumber, accessToken };
    } catch (err) {
      if ((err as { code?: number }).code === 11000 && attempt < 2) continue;
      await releaseStock(reserved);
      if (couponCode) await Coupon.updateOne({ code: couponCode }, { $inc: { usedCount: -1 } });
      throw err;
    }
  }
  throw new ApiError(500, "Could not create order");
}

/** Returns stock for a cancelled order's items. */
export async function restockOrder(items: { product?: unknown; size?: string | null; qty?: number | null }[]) {
  await releaseStock(
    items.filter((i) => i.product && i.size && i.qty).map((i) => ({ product: i.product, size: i.size!, qty: i.qty! })),
  );
}

export async function recomputeRating(productId: unknown) {
  await connectDB();
  const [agg] = await Review.aggregate<{ avg: number; n: number }>([
    { $match: { product: new Types.ObjectId(String(productId)), approved: true } },
    { $group: { _id: null, avg: { $avg: "$rating" }, n: { $sum: 1 } } },
  ]);
  await Product.updateOne(
    { _id: productId },
    { rating: agg ? Math.round(agg.avg * 10) / 10 : 0, reviewCount: agg?.n ?? 0 },
  );
}
