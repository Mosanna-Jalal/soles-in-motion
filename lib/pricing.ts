export interface PricingSettings {
  shippingFee: number;
  freeShippingThreshold: number;
  taxRate: number;
}

export interface Totals {
  subtotal: number;
  discount: number;
  shipping: number;
  /** GST portion already included in the (tax-inclusive) prices. */
  tax: number;
  total: number;
}

export function couponDiscount(coupon: { type: "percent" | "fixed"; value: number }, subtotal: number) {
  const raw = coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  return Math.max(0, Math.min(raw, subtotal));
}

export function computeTotals(subtotal: number, discount: number, s: PricingSettings): Totals {
  const d = Math.max(0, Math.min(discount, subtotal));
  const net = subtotal - d;
  const shipping = net === 0 || net >= s.freeShippingThreshold ? 0 : s.shippingFee;
  const tax = Math.round((net * s.taxRate) / (100 + s.taxRate));
  return { subtotal, discount: d, shipping, tax, total: net + shipping };
}
