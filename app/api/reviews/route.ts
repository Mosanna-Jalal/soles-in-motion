import { connectDB } from "@/lib/db";
import { Product, Review } from "@/lib/models";
import { ApiError, handle, json, rateLimit } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { reviewInput } from "@/lib/validators";

/** New reviews are held for moderation in the admin panel. */
export const POST = handle(async (req: Request) => {
  rateLimit(req, "review", 5);
  const data = reviewInput.parse(await req.json());
  await connectDB();
  if (!(await Product.exists({ _id: data.productId, active: true }))) throw new ApiError(404, "Product not found");
  const session = await getSession();
  await Review.create({
    product: data.productId,
    user: session?.id ?? null,
    name: data.name,
    rating: data.rating,
    title: data.title,
    body: data.body,
    approved: false,
  });
  return json({ ok: true }, 201);
});
