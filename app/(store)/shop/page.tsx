import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/components/store/ProductCard";
import { Pagination, ShopSidebar, ShopToolbar, type ShopParams } from "@/components/store/ShopFilters";
import { SplitText } from "@/components/motion/primitives";
import { getBrands, getCategories, getProducts, getSizes } from "@/lib/data";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function normalize(sp: Record<string, string | string[] | undefined>): ShopParams {
  const out: ShopParams = {};
  for (const k of ["q", "category", "gender", "brand", "size", "min", "max", "sort", "page", "tag"]) {
    const v = sp[k];
    const s = Array.isArray(v) ? v[0] : v;
    if (s) out[k] = s.slice(0, 120);
  }
  return out;
}

export async function generateMetadata(props: PageProps<"/shop">): Promise<Metadata> {
  const p = normalize(await props.searchParams);
  const cats = await getCategories();
  const cat = cats.find((c) => c.slug === p.category);
  const title = cat?.name ?? (p.q ? `Search: ${p.q}` : p.tag === "sale" ? "Sale" : p.tag === "new" ? "New arrivals" : "Shop all footwear");
  return { title, description: cat?.description ?? "Shop sneakers, running shoes, boots, heels and formals at Soles in Motion." };
}

export default async function ShopPage(props: PageProps<"/shop">) {
  const params = normalize(await props.searchParams);
  const [result, categories, brands, sizes] = await Promise.all([getProducts(params), getCategories(), getBrands(), getSizes()]);
  const category = categories.find((c) => c.slug === params.category);

  const heading =
    category?.name ??
    (params.q
      ? `“${params.q}”`
      : params.tag === "new"
        ? "New arrivals"
        : params.tag === "sale"
          ? "On sale"
          : params.tag === "bestseller"
            ? "Bestsellers"
            : params.gender === "men"
              ? "Men's footwear"
              : params.gender === "women"
                ? "Women's footwear"
                : "Shop all");

  return (
    <div className="pb-10">
      <section className="relative overflow-hidden border-b border-line pb-10 pt-36 sm:pt-44">
        {category?.image?.url && (
          <>
            <Image src={category.image.url} alt="" fill priority sizes="100vw" className="object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/40" />
          </>
        )}
        <div className="container-x relative">
          <nav className="font-mono text-[11px] uppercase tracking-widest text-mist" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-volt">
              Home
            </Link>{" "}
            / <Link href="/shop" className="hover:text-volt">Shop</Link>
            {category && <> / {category.name}</>}
          </nav>
          <SplitText key={heading} as="h1" trigger="mount" text={heading} className="display mt-4 block text-7xl sm:text-9xl" />
          {category?.tagline && <p className="mt-3 max-w-xl text-lg text-bone/75">{category.tagline}</p>}
          <div className="no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <Link
              href="/shop"
              className={cn(
                "shrink-0 rounded-full border px-5 py-2 text-sm font-semibold transition-colors",
                !params.category ? "border-volt bg-volt text-ink" : "border-line hover:border-bone",
              )}
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c._id}
                href={`/shop?category=${c.slug}`}
                className={cn(
                  "shrink-0 rounded-full border px-5 py-2 text-sm font-semibold transition-colors",
                  params.category === c.slug ? "border-volt bg-volt text-ink" : "border-line hover:border-bone",
                )}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container-x mt-8 grid gap-10 lg:grid-cols-[260px_1fr]">
        <ShopSidebar params={params} categories={categories} brands={brands} sizes={sizes} />
        <div>
          <ShopToolbar params={params} categories={categories} brands={brands} sizes={sizes} total={result.total} />
          {result.items.length ? (
            <ProductGrid products={result.items} className="mt-8 xl:grid-cols-3" />
          ) : (
            <div className="grid place-items-center py-32 text-center">
              <p className="display text-5xl">No matches</p>
              <p className="mt-3 max-w-sm text-mist">Try removing a filter or two — or browse everything we have.</p>
              <Link href="/shop" className="btn-volt mt-6">
                Reset filters
              </Link>
            </div>
          )}
          <Pagination params={params} page={result.page} pages={result.pages} />
        </div>
      </div>
    </div>
  );
}
