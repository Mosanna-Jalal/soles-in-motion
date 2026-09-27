import { connectDB } from "@/lib/db";
import { Coupon } from "@/lib/models";
import { ApiError, handle, json } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { couponInput } from "@/lib/validators";

export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const data = couponInput.parse(await req.json());
  if (data.type === "percent" && data.value > 90) throw new ApiError(400, "Percentage discounts are capped at 90%");
  await connectDB();
  const c = await Coupon.create(data);
  return json({ id: String(c._id) }, 201);
});
