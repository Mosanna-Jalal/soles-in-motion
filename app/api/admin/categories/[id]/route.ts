import { connectDB } from "@/lib/db";
import { Category, Product } from "@/lib/models";
import { ApiError, handle, json } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { destroyIfUnreferenced, removedMedia } from "@/lib/media-refs";
import { uniqueSlug } from "@/lib/slug";
import { categoryInput } from "@/lib/validators";
import type { Media } from "@/lib/types";

type Ctx = RouteContext<"/api/admin/categories/[id]">;

async function load(ctx: Ctx) {
  const { id } = await ctx.params;
  if (!/^[a-f0-9]{24}$/i.test(id)) throw new ApiError(404, "Category not found");
  await connectDB();
  const cat = await Category.findById(id).lean();
  if (!cat) throw new ApiError(404, "Category not found");
  return cat;
}

export const PUT = handle(async (req: Request, ctx: Ctx) => {
  await requireAdmin();
  const old = await load(ctx);
  const data = categoryInput.parse(await req.json());
  const slug = await uniqueSlug(Category as never, data.slug || data.name, String(old._id));
  await Category.updateOne({ _id: old._id }, { ...data, slug, image: data.image ?? null });
  const cleanup = await destroyIfUnreferenced(removedMedia([old.image as Media], [data.image as Media]));
  return json({ ok: true, mediaDeleted: cleanup.deleted.length });
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  await requireAdmin();
  const cat = await load(ctx);
  const inUse = await Product.countDocuments({ category: cat._id });
  if (inUse) throw new ApiError(409, `${inUse} product${inUse > 1 ? "s are" : " is"} still in “${cat.name}”. Move or delete them first.`);
  await Category.deleteOne({ _id: cat._id });
  const cleanup = await destroyIfUnreferenced(cat.image ? [cat.image as Media] : []);
  return json({ ok: true, mediaDeleted: cleanup.deleted.length });
});
