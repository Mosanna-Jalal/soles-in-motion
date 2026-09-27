import { cache } from "react";
import type { SortOrder } from "mongoose";
import { connectDB, serialize } from "./db";
import { Banner, Category, Order, Product, Review, Setting } from "./models";
import { escapeRegex } from "./utils";
import type { BannerT, CategoryT, ProductT, ReviewT, SettingsT } from "./types";

export const getSettings = cache(async (): Promise<SettingsT> => {
  await connectDB();
  const doc =
    (await Setting.findOne({ key: "store" }).lean()) ??
    (await Setting.findOneAndUpdate({ key: "store" }, { $setOnInsert: { key: "store" } }, { upsert: true, new: true }).lean());
  return serialize(doc);
});

export const getCategories = cache(async (): Promise<CategoryT[]> => {
  await connectDB();
  const [cats, counts] = await Promise.all([
    Category.find().sort({ order: 1, name: 1 }).lean(),
    Product.aggregate<{ _id: unknown; n: number }>([
      { $match: { active: true } },
      { $group: { _id: "$category", n: { $sum: 1 } } },
    ]),
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.n]));
  return serialize(cats.map((c) => ({ ...c, productCount: map.get(String(c._id)) ?? 0 })));
});

export async function getBanners(placement: "hero" | "promo"): Promise<BannerT[]> {
  await connectDB();
  return serialize(await Banner.find({ placement, active: true }).sort({ order: 1, createdAt: 1 }).lean());
}

export interface ProductQuery {
  q?: string;
  category?: string;
  gender?: string;
  brand?: string;
  size?: string;
  min?: string;
  max?: string;
  sort?: string;
  page?: string;
  tag?: string;
}

const SORTS: Record<string, Record<string, SortOrder>> = {
  featured: { featured: -1, soldCount: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  "price-asc": { price: 1 },
  "price-desc": { price: -1 },
  popular: { soldCount: -1 },
  rating: { rating: -1, reviewCount: -1 },
};

export const PAGE_SIZE = 12;

export async function getProducts(query: ProductQuery, limit = PAGE_SIZE) {
  await connectDB();
  const filter: Record<string, unknown> = { active: true };

  if (query.category) {
    const cat = await Category.findOne({ slug: query.category }, { _id: 1 }).lean();
    filter.category = cat?._id ?? null;
  }
  if (query.gender === "men" || query.gender === "women") filter.gender = { $in: [query.gender, "unisex"] };
  else if (query.gender) filter.gender = query.gender;
  if (query.brand) filter.brand = { $in: query.brand.split(",").filter(Boolean) };
  if (query.size) {
    filter.sizes = { $elemMatch: { size: { $in: query.size.split(",") }, stock: { $gt: 0 } } };
  }
  const min = Number(query.min);
  const max = Number(query.max);
  if (min > 0 || max > 0) {
    filter.price = { ...(min > 0 ? { $gte: min } : {}), ...(max > 0 ? { $lte: max } : {}) };
  }
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q.trim()), "i");
    filter.$or = [{ name: rx }, { brand: rx }, { tags: rx }];
  }
  if (query.tag === "new") filter.isNewArrival = true;
  if (query.tag === "bestseller") filter.bestseller = true;
  if (query.tag === "sale") filter.$expr = { $gt: ["$compareAtPrice", "$price"] };

  const page = Math.max(1, Number(query.page) || 1);
  const sort = SORTS[query.sort ?? "featured"] ?? SORTS.featured;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("category", "name slug")
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    items: serialize<ProductT[]>(items),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getProductList(filter: Record<string, unknown>, sort: Record<string, SortOrder>, limit: number) {
  await connectDB();
  const items = await Product.find({ active: true, ...filter })
    .sort(sort)
    .limit(limit)
    .populate("category", "name slug")
    .lean();
  return serialize<ProductT[]>(items);
}

export const getProductBySlug = cache(async (slug: string): Promise<ProductT | null> => {
  await connectDB();
  const p = await Product.findOne({ slug, active: true }).populate("category", "name slug").lean();
  return p ? serialize<ProductT>(p) : null;
});

export async function getRelatedProducts(product: ProductT) {
  const categoryId = typeof product.category === "string" ? product.category : product.category._id;
  return getProductList({ category: categoryId, _id: { $ne: product._id } }, { soldCount: -1 }, 8);
}

export async function getReviews(productId: string): Promise<ReviewT[]> {
  await connectDB();
  return serialize(await Review.find({ product: productId, approved: true }).sort({ createdAt: -1 }).limit(50).lean());
}

export async function getBrands(): Promise<string[]> {
  await connectDB();
  const brands = await Product.distinct("brand", { active: true });
  return (brands as string[]).sort();
}

export async function getSizes(): Promise<string[]> {
  await connectDB();
  const sizes = (await Product.distinct("sizes.size", { active: true })) as string[];
  return sizes.sort((a, b) => parseFloat(a) - parseFloat(b));
}

export async function getTestimonials(): Promise<(ReviewT & { product: { name: string; slug: string } })[]> {
  await connectDB();
  const rows = await Review.find({ approved: true, rating: 5 })
    .sort({ createdAt: -1 })
    .limit(14)
    .populate("product", "name slug")
    .lean();
  return serialize(rows.filter((r) => r.product));
}

export async function getHomeData() {
  const [hero, promo, featured, newArrivals, bestsellers, categories, testimonials] = await Promise.all([
    getBanners("hero"),
    getBanners("promo"),
    getProductList({ featured: true }, { soldCount: -1 }, 6),
    getProductList({ isNewArrival: true }, { createdAt: -1 }, 12),
    getProductList({ bestseller: true }, { soldCount: -1 }, 10),
    getCategories(),
    getTestimonials(),
  ]);
  const [withVideo] = await getProductList({ featured: true, video: { $ne: null } }, { soldCount: -1 }, 1);
  const spotlight = withVideo ?? featured[0] ?? null;
  return { hero, promo, featured, newArrivals, bestsellers, categories, testimonials, spotlight };
}

export async function getStoreStats() {
  await connectDB();
  const [products, emails] = await Promise.all([
    Product.countDocuments({ active: true }),
    Order.distinct("email", { status: { $ne: "cancelled" } }),
  ]);
  return { products, customers: emails.length };
}
