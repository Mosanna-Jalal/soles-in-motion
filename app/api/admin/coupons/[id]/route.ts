import { connectDB } from "@/lib/db";
import { Coupon } from "@/lib/models";
import { ApiError, handle, json } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { couponInput } from "@/lib/validators";

type Ctx = RouteContext<"/api/admin/coupons/[id]">;

async function id(ctx: Ctx) {
  const { id } = await ctx.params;
  if (!/^[a-f0-9]{24}$/i.test(id)) throw new ApiError(404, "Coupon not found");
  await connectDB();
  return id;
}

export const PUT = handle(async (req: Request, ctx: Ctx) => {
  await requireAdmin();
  const data = couponInput.parse(await req.json());
  if (data.type === "percent" && data.value > 90) throw new ApiError(400, "Percentage discounts are capped at 90%");
  const r = await Coupon.updateOne({ _id: await id(ctx) }, data);
  if (!r.matchedCount) throw new ApiError(404, "Coupon not found");
  return json({ ok: true });
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  await requireAdmin();
  await Coupon.deleteOne({ _id: await id(ctx) });
  return json({ ok: true });
});
