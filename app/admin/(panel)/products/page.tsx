import Link from "next/link";
import type { SortOrder } from "mongoose";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import ProductsTable from "@/components/admin/ProductsTable";
import { connectDB, serialize } from "@/lib/db";
import { Category, Product } from "@/lib/models";
import { escapeRegex } from "@/lib/utils";
import type { CategoryT, ProductT } from "@/lib/types";

export const metadata = { title: "Products" };

export default async function ProductsAdmin(props: PageProps<"/admin/products">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : "";
  const cat = typeof sp.category === "string" ? sp.category : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (q) filter.$or = [{ name: new RegExp(escapeRegex(q), "i") }, { brand: new RegExp(escapeRegex(q), "i") }];
  if (/^[a-f0-9]{24}$/i.test(cat)) filter.category = cat;
  if (status === "active") filter.active = true;
  if (status === "draft") filter.active = false;
  if (status === "low") filter.$expr = { $lte: [{ $sum: "$sizes.stock" }, 20] };
  const sort: Record<string, SortOrder> = { createdAt: -1 };
  const [products, categories, total] = await Promise.all([
    Product.find(filter).sort(sort).populate("category", "name slug").lean(),
    Category.find().sort({ order: 1 }).lean(),
    Product.countDocuments(),
  ]);

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={`${total} products in the catalogue`}
        actions={
          <Link href="/admin/products/new" className="btn-volt py-2.5">
            <Plus className="h-4 w-4" /> New product
          </Link>
        }
      />
      <ProductsTable products={serialize<ProductT[]>(products)} categories={serialize<CategoryT[]>(categories)} query={{ q, category: cat, status }} />
    </>
  );
}
