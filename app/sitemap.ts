import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Category, Product } from "@/lib/models";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const statics = ["", "/shop", "/about", "/contact", "/faq", "/track"].map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p ? 0.7 : 1 }));
  try {
    await connectDB();
    const [products, cats] = await Promise.all([
      Product.find({ active: true }, { slug: 1, updatedAt: 1 }).lean(),
      Category.find({}, { slug: 1, updatedAt: 1 }).lean(),
    ]);
    return [
      ...statics,
      ...cats.map((c) => ({ url: `${base}/shop?category=${c.slug}`, lastModified: c.updatedAt as Date, priority: 0.8 })),
      ...products.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.updatedAt as Date, priority: 0.9 })),
    ];
  } catch {
    return statics;
  }
}
