import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Parallax, Reveal, SplitText } from "@/components/motion/primitives";
import type { BannerT } from "@/lib/types";

export default function Flagship({ banner }: { banner?: BannerT }) {
  if (!banner?.media || banner.media.resourceType !== "image") return null;
  return (
    <section className="container-x py-24 sm:py-32">
      <div className="grid overflow-hidden rounded-[32px] border border-line bg-ink-2 lg:grid-cols-2">
        <Parallax offset={60} className="min-h-[380px] lg:min-h-[560px]">
          <Image src={banner.media.url} alt={banner.title} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
        </Parallax>
        <div className="flex flex-col justify-center gap-6 p-8 sm:p-14">
          {banner.eyebrow && (
            <Reveal>
              <p className="eyebrow flex items-center gap-2 text-volt">
                <MapPin className="h-4 w-4" /> {banner.eyebrow}
              </p>
            </Reveal>
          )}
          <SplitText as="h2" text={banner.title} className="display block text-6xl sm:text-7xl" />
          {banner.subtitle && (
            <Reveal delay={0.15}>
              <p className="max-w-md text-lg text-mist">{banner.subtitle}</p>
            </Reveal>
          )}
          {banner.ctaHref && (
            <Reveal delay={0.25}>
              <Link href={banner.ctaHref} className="btn-bone w-fit">
                {banner.ctaLabel || "Learn more"} <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
