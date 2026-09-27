import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Review } from "@/lib/models";
import { ApiError, handle, json } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { recomputeRating } from "@/lib/orders";

type Ctx = RouteContext<"/api/admin/reviews/[id]">;

async function load(ctx: Ctx) {
  const { id } = await ctx.params;
  if (!/^[a-f0-9]{24}$/i.test(id)) throw new ApiError(404, "Review not found");
  await connectDB();
  const r = await Review.findById(id);
  if (!r) throw new ApiError(404, "Review not found");
  return r;
}

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  await requireAdmin();
  const review = await load(ctx);
  const { approved } = z.object({ approved: z.boolean() }).parse(await req.json());
  review.approved = approved;
  await review.save();
  await recomputeRating(review.product);
  return json({ ok: true });
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  await requireAdmin();
  const review = await load(ctx);
  await review.deleteOne();
  await recomputeRating(review.product);
  return json({ ok: true });
});
