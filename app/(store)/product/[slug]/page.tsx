import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/store/ProductGallery";
import BuyBox from "@/components/store/BuyBox";
import Reviews from "@/components/store/Reviews";
import Carousel from "@/components/home/Carousel";
import { getProductBySlug, getRelatedProducts, getReviews } from "@/lib/data";
import { cldImage } from "@/lib/cld";
import { totalStock } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product not found" };
  const description = p.description.split("\n")[0].slice(0, 160);
  const image = p.images[0]?.url ? cldImage(p.images[0].url, 1200, "c_fill,h_630,w_1200") : undefined;
  return {
    title: `${p.name} — ${p.brand}`,
    description,
    openGraph: { title: p.name, description, images: image ? [{ url: image, width: 1200, height: 630 }] : undefined },
  };
}

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const [reviews, related] = await Promise.all([getReviews(product._id), getRelatedProducts(product)]);
  const category = typeof product.category === "object" ? product.category : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: product.brand },
    image: product.images.map((m) => m.url),
    description: product.description,
    sku: product._id,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability: totalStock(product.sizes) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(product.reviewCount > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount },
    }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="container-x pt-32 sm:pt-36">
        <nav className="font-mono text-[11px] uppercase tracking-widest text-mist" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-volt">
            Home
          </Link>{" "}
          / <Link href="/shop" className="hover:text-volt">Shop</Link>
          {category && (
            <>
              {" "}
              /{" "}
              <Link href={`/shop?category=${category.slug}`} className="hover:text-volt">
                {category.name}
              </Link>
            </>
          )}{" "}
          / <span className="text-bone/70">{product.name}</span>
        </nav>
        <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_1fr] xl:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <ProductGallery images={product.images} video={product.video} name={product.name} />
          </div>
          <BuyBox product={product} />
        </div>
      </div>
      <Reviews productId={product._id} reviews={reviews} rating={product.rating} />
      {related.length > 0 && <Carousel products={related} eyebrow="Keep exploring" title="You may also like" />}
    </>
  );
}
