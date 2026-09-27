import ProductForm from "@/components/admin/ProductForm";
import { connectDB, serialize } from "@/lib/db";
import { Category, Product } from "@/lib/models";
import type { CategoryT } from "@/lib/types";

export const metadata = { title: "New product" };

export default async function NewProduct() {
  await connectDB();
  const [categories, brands] = await Promise.all([Category.find().sort({ order: 1 }).lean(), Product.distinct("brand")]);
  return <ProductForm categories={serialize<CategoryT[]>(categories)} brands={(brands as string[]).sort()} />;
}
