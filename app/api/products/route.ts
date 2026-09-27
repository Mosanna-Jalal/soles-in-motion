import { getProducts } from "@/lib/data";
import { handle, json } from "@/lib/api";

export const GET = handle(async (req: Request) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.slice(0, 60) ?? "";
  const limit = Math.min(24, Math.max(1, Number(url.searchParams.get("limit")) || 8));
  const { items, total } = await getProducts({ q, sort: "popular" }, limit);
  return json({
    total,
    items: items.map((p) => ({
      _id: p._id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      price: p.price,
      image: p.images[0]?.url,
      category: typeof p.category === "object" ? p.category.name : undefined,
    })),
  });
});
