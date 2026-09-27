import { connectDB } from "@/lib/db";
import { Category } from "@/lib/models";
import { handle, json } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { uniqueSlug } from "@/lib/slug";
import { categoryInput } from "@/lib/validators";

export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const data = categoryInput.parse(await req.json());
  await connectDB();
  const slug = await uniqueSlug(Category as never, data.slug || data.name);
  const cat = await Category.create({ ...data, slug, image: data.image ?? null });
  return json({ id: String(cat._id) }, 201);
});
