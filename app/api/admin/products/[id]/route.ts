import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Category, Order, Product, Review } from "@/lib/models";
import { ApiError, handle, json } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { destroyIfUnreferenced, removedMedia } from "@/lib/media-refs";
import { uniqueSlug } from "@/lib/slug";
import { productInput } from "@/lib/validators";
import type { Media } from "@/lib/types";

type Ctx = RouteContext<"/api/admin/products/[id]">;

async function load(ctx: Ctx) {
  const { id } = await ctx.params;
  if (!/^[a-f0-9]{24}$/i.test(id)) throw new ApiError(404, "Product not found");
  await connectDB();
  const product = await Product.findById(id).lean();
  if (!product) throw new ApiError(404, "Product not found");
  return product;
}

/** Full update. Images/videos that were removed in the form are deleted from Cloudinary after the save. */
export const PUT = handle(async (req: Request, ctx: Ctx) => {
  await requireAdmin();
  const old = await load(ctx);
  const data = productInput.parse(await req.json());
  if (!(await Category.exists({ _id: data.category }))) throw new ApiError(400, "Pick a valid category");
  const slug = await uniqueSlug(Product as never, data.slug || data.name, String(old._id));

  await Product.updateOne(
    { _id: old._id },
    { ...data, slug, compareAtPrice: data.compareAtPrice || null, video: data.video ?? null },
    { runValidators: true },
  );

  const removed = removedMedia([...(old.images as Media[]), old.video as Media], [...data.images, data.video as Media]);
  const cleanup = await destroyIfUnreferenced(removed);
  return json({ ok: true, slug, mediaDeleted: cleanup.deleted.length });
});

const patchInput = z
  .object({ active: z.boolean(), featured: z.boolean(), isNewArrival: z.boolean(), bestseller: z.boolean() })
  .partial();

/** Quick toggles from the products table. */
export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  await requireAdmin();
  const old = await load(ctx);
  const data = patchInput.parse(await req.json());
  await Product.updateOne({ _id: old._id }, data);
  return json({ ok: true });
});

/** Deletes the product, its reviews and every Cloudinary asset it owned. */
export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  await requireAdmin();
  const product = await load(ctx);
  await Promise.all([Product.deleteOne({ _id: product._id }), Review.deleteMany({ product: product._id })]);
  const cleanup = await destroyIfUnreferenced([...(product.images as Media[]), ...(product.video ? [product.video as Media] : [])]);
  const orders = await Order.countDocuments({ "items.product": product._id });
  return json({ ok: true, mediaDeleted: cleanup.deleted.length, mediaFailed: cleanup.failed.length, orders });
});
