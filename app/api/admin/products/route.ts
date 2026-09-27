import { connectDB } from "@/lib/db";
import { Category, Product } from "@/lib/models";
import { ApiError, handle, json } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { uniqueSlug } from "@/lib/slug";
import { productInput } from "@/lib/validators";

export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const data = productInput.parse(await req.json());
  await connectDB();
  if (!(await Category.exists({ _id: data.category }))) throw new ApiError(400, "Pick a valid category");
  const slug = await uniqueSlug(Product as never, data.slug || data.name);
  const product = await Product.create({
    ...data,
    slug,
    compareAtPrice: data.compareAtPrice || null,
    video: data.video ?? null,
  });
  return json({ id: String(product._id), slug }, 201);
});
