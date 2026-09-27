import { z } from "zod";
import { handle, json, rateLimit } from "@/lib/api";
import { validateCoupon } from "@/lib/orders";

const input = z.object({ code: z.string().trim().min(1).max(20), subtotal: z.coerce.number().min(0) });

export const POST = handle(async (req: Request) => {
  rateLimit(req, "coupon", 20);
  const { code, subtotal } = input.parse(await req.json());
  const { coupon, discount } = await validateCoupon(code, subtotal);
  return json({ code: coupon.code, description: coupon.description, type: coupon.type, value: coupon.value, discount });
});
