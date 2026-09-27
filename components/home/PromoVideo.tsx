"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Pause, Play } from "lucide-react";
import { useRef, useState } from "react";
import { Magnetic, SplitText } from "@/components/motion/primitives";
import { cldPoster, cldVideo } from "@/lib/cld";
import type { BannerT } from "@/lib/types";

/** A video panel that grows from an inset card to full-bleed as it scrolls into view. */
export default function PromoVideo({ banner }: { banner?: BannerT }) {
  const ref = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const inset = useTransform(scrollYProgress, [0, 1], [14, 0]);
  const radius = useTransform(scrollYProgress, [0, 1], [48, 0]);
  const clipPath = useTransform([inset, radius] as never, ([i, r]: number[]) => `inset(${i}% ${i}% ${i}% ${i}% round ${r}px)`);
  const textY = useTransform(scrollYProgress, [0, 1], [120, 0]);

  if (!banner?.media) return null;
  const isVideo = banner.media.resourceType === "video";

  return (
    <section ref={ref} className="relative h-[110vh] min-h-[640px] bg-ink">
      <motion.div className="absolute inset-0 overflow-hidden" style={{ clipPath }}>
        {isVideo ? (
          <video
            ref={video}
            className="absolute inset-0 h-full w-full object-cover"
            src={cldVideo(banner.media.url, 1600)}
            poster={cldPoster(banner.media.url, 1600)}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner.media.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-ink/20" />
      </motion.div>

      <motion.div style={{ y: textY }} className="container-x relative flex h-full flex-col items-center justify-center text-center">
        {banner.eyebrow && <p className="eyebrow mb-5 text-volt">{banner.eyebrow}</p>}
        <SplitText as="h2" text={banner.title} className="display block max-w-6xl text-[13vw] sm:text-[9vw] lg:text-[7.5vw]" />
        {banner.subtitle && <p className="mt-6 max-w-xl text-lg text-bone/80">{banner.subtitle}</p>}
        {banner.ctaHref && (
          <Magnetic className="mt-10">
            <Link href={banner.ctaHref} className="btn-volt px-9 py-4">
              {banner.ctaLabel || "Shop now"} <ArrowRight className="h-4 w-4" />
            </Link>
          </Magnetic>
        )}
      </motion.div>

      {isVideo && (
        <button
          onClick={() => {
            const v = video.current;
            if (!v) return;
            if (v.paused) {
              v.play();
              setPlaying(true);
            } else {
              v.pause();
              setPlaying(false);
            }
          }}
          className="absolute bottom-8 right-8 grid h-12 w-12 place-items-center rounded-full border border-bone/30 bg-ink/40 backdrop-blur transition-colors hover:bg-bone hover:text-ink"
          aria-label={playing ? "Pause video" : "Play video"}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
      )}
    </section>
  );
}
