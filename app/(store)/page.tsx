import Hero from "@/components/home/Hero";
import VelocityMarquee from "@/components/home/VelocityMarquee";
import FeaturedDrop from "@/components/home/FeaturedDrop";
import CategoryBento from "@/components/home/CategoryBento";
import Spotlight from "@/components/home/Spotlight";
import NewArrivals from "@/components/home/NewArrivals";
import PromoVideo from "@/components/home/PromoVideo";
import Carousel from "@/components/home/Carousel";
import Values from "@/components/home/Values";
import Testimonials from "@/components/home/Testimonials";
import Flagship from "@/components/home/Flagship";
import JoinCTA from "@/components/home/JoinCTA";
import { getBrands, getHomeData, getStoreStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [data, brands, stats] = await Promise.all([getHomeData(), getBrands(), getStoreStats()]);

  return (
    <>
      <Hero banners={data.hero} />
      <VelocityMarquee brands={brands} />
      <FeaturedDrop products={data.featured} />
      <CategoryBento categories={data.categories} />
      <Spotlight product={data.spotlight} />
      <NewArrivals products={data.newArrivals} />
      <PromoVideo banner={data.promo.find((b) => b.media?.resourceType === "video")} />
      <Carousel products={data.bestsellers} eyebrow="Most wanted" title="Bestsellers" />
      <Values customers={stats.customers} products={stats.products} />
      <Testimonials reviews={data.testimonials} />
      <Flagship banner={data.promo.find((b) => b.media?.resourceType === "image")} />
      <JoinCTA />
    </>
  );
}
