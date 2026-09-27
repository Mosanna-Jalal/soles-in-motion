import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { connectDB, serialize } from "@/lib/db";
import { Category, Product } from "@/lib/models";
import type { CategoryT, ProductT } from "@/lib/types";

export const metadata = { title: "Edit product" };

export default async function EditProduct(props: PageProps<"/admin/products/[id]">) {
  const { id } = await props.params;
  if (!/^[a-f0-9]{24}$/i.test(id)) notFound();
  await connectDB();
  const [product, categories, brands] = await Promise.all([
    Product.findById(id).lean(),
    Category.find().sort({ order: 1 }).lean(),
    Product.distinct("brand"),
  ]);
  if (!product) notFound();
  return <ProductForm key={id} product={serialize<ProductT>(product)} categories={serialize<CategoryT[]>(categories)} brands={(brands as string[]).sort()} />;
}
