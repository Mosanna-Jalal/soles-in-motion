import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import StoreMap from "@/components/store/StoreMap";
import { Parallax, Reveal, SplitText } from "@/components/motion/primitives";
import type { BannerT, SettingsT } from "@/lib/types";

export default function Flagship({ banner, store }: { banner?: BannerT; store: SettingsT }) {
  const image = banner?.media?.resourceType === "image" ? banner.media.url : null;
  return (
    <section className="container-x py-24 sm:py-32">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col overflow-hidden rounded-[32px] border border-line bg-ink-2">
          {image && (
            <Parallax offset={50} className="h-56 sm:h-72">
              <Image src={image} alt={`Inside ${store.storeName}`} fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" />
            </Parallax>
          )}
          <div className="flex flex-1 flex-col justify-center gap-5 p-8 sm:p-12">
            <Reveal>
              <p className="eyebrow flex items-center gap-2 text-volt">
                <MapPin className="h-4 w-4" /> {banner?.eyebrow || "Visit our store"}
              </p>
            </Reveal>
            <SplitText as="h2" text={banner?.title || "Come try them on"} className="display block text-6xl sm:text-7xl" />
            <Reveal delay={0.15}>
              <p className="max-w-md text-lg text-mist">{banner?.subtitle || `${store.address}. ${store.hours}.`}</p>
            </Reveal>
            <Reveal delay={0.25}>
              <Link href={banner?.ctaHref || "/contact#map"} className="btn-bone w-fit">
                {banner?.ctaLabel || "Plan your visit"} <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>
        </div>
        <StoreMap lat={store.mapLat} lng={store.mapLng} name={store.storeName} address={store.address} hours={store.hours} compact className="min-h-[480px] lg:min-h-0" />
      </div>
    </section>
  );
}
