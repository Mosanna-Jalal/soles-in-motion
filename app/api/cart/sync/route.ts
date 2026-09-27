import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models";
import { handle, json } from "@/lib/api";

const input = z.object({
  items: z
    .array(z.object({ key: z.string().max(80), productId: z.string().regex(/^[a-f0-9]{24}$/i), size: z.string().max(10) }))
    .max(50),
});

/** Returns fresh price/stock for each bag line; `null` means the line should be removed. */
export const POST = handle(async (req: Request) => {
  const { items } = input.parse(await req.json());
  await connectDB();
  const products = await Product.find(
    { _id: { $in: items.map((i) => i.productId) } },
    { name: 1, slug: 1, brand: 1, price: 1, compareAtPrice: 1, images: { $slice: 1 }, sizes: 1, active: 1 },
  ).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const updates: Record<string, object | null> = {};
  for (const i of items) {
    const p = byId.get(i.productId);
    const size = p?.sizes.find((s) => s.size === i.size);
    if (!p || !p.active || !size || size.stock <= 0) {
      updates[i.key] = null;
      continue;
    }
    updates[i.key] = {
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      image: p.images?.[0]?.url,
      maxQty: size.stock,
    };
  }
  return json({ updates });
});
