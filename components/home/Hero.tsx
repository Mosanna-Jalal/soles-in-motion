"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Magnetic, SplitText } from "@/components/motion/primitives";
import { cldImage, cldPoster, cldVideo } from "@/lib/cld";
import type { BannerT } from "@/lib/types";

const SLIDE_MS = 8000;

function SlideMedia({ banner, active }: { banner: BannerT; active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const m = banner.media;
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else v.pause();
  }, [active]);

  if (!m) return <div className="absolute inset-0 bg-ink-3" />;
  if (m.resourceType === "video") {
    return (
      <video
        ref={ref}
        className="absolute inset-0 h-full w-full object-cover"
        src={cldVideo(m.url, 1600)}
        poster={banner.poster?.url ? cldImage(banner.poster.url, 1600) : cldPoster(m.url, 1600)}
        muted
        loop
        playsInline
        preload={active ? "auto" : "metadata"}
      />
    );
  }
  return <Image src={m.url} alt={banner.title} fill priority sizes="100vw" className="object-cover" />;
}

export default function Hero({ banners }: { banners: BannerT[] }) {
  const [index, setIndex] = useState(0);
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const radius = useTransform(scrollYProgress, [0, 1], [0, 48]);

  useEffect(() => {
    if (banners.length < 2) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % banners.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, banners.length]);

  if (!banners.length) {
    return (
      <section className="grid h-[70vh] place-items-center bg-ink-2 pt-24 text-center">
        <p className="display text-6xl">Add a hero banner from the admin panel</p>
      </section>
    );
  }

  const current = banners[index];

  return (
    <section ref={section} className="relative min-h-[max(100svh,640px)] bg-ink">
      <motion.div className="absolute inset-0 overflow-hidden" style={{ borderBottomLeftRadius: radius, borderBottomRightRadius: radius }}>
        <motion.div className="absolute inset-0" style={{ scale }}>
          {banners.map((b, i) => (
            <motion.div
              key={b._id}
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: i === index ? 1 : 0, scale: i === index ? 1 : 1.08 }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <SlideMedia banner={b} active={i === index} />
            </motion.div>
          ))}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-ink/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-transparent to-transparent" />
        <div className="grain absolute inset-0" />
      </motion.div>

      <motion.div style={{ y: contentY, opacity: fade }} className="container-x relative flex min-h-[max(100svh,640px)] flex-col justify-end pb-24 pt-36 sm:pb-28">
        <AnimatePresence mode="wait">
          <motion.div key={current._id} exit={{ opacity: 0, y: -30, transition: { duration: 0.4 } }} className="max-w-5xl">
            {current.eyebrow && (
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="eyebrow mb-5 flex items-center gap-3 text-volt"
              >
                <span className="h-px w-10 bg-volt" /> {current.eyebrow}
              </motion.p>
            )}
            <SplitText
              as="h1"
              trigger="mount"
              delay={0.15}
              text={current.title}
              className="display block text-[min(15vw,13svh)] sm:text-[min(11vw,13svh)] lg:text-[min(8.6vw,13svh)]"
            />
            {current.subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.55 }}
                className="mt-6 max-w-xl text-base text-bone/80 sm:text-lg"
              >
                {current.subtitle}
              </motion.p>
            )}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.7 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              {current.ctaHref && (
                <Magnetic>
                  <Link href={current.ctaHref} className="btn-volt px-8 py-4">
                    {current.ctaLabel || "Shop now"} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Magnetic>
              )}
              <Magnetic>
                <Link href="/shop" className="btn-ghost px-8 py-4 backdrop-blur-sm">
                  Explore all
                </Link>
              </Magnetic>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 flex items-end justify-between gap-6">
          <div className="flex w-full max-w-md gap-2">
            {banners.map((b, i) => (
              <button key={b._id} onClick={() => setIndex(i)} className="group flex-1 py-3 text-left" aria-label={`Show slide ${i + 1}`}>
                <span className="mb-2 block font-mono text-[10px] text-bone/60 transition-colors group-hover:text-bone">
                  0{i + 1}
                </span>
                <span className="block h-[2px] overflow-hidden bg-bone/20">
                  {i === index && (
                    <motion.span
                      key={`${index}-bar`}
                      className="block h-full bg-volt"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: SLIDE_MS / 1000, ease: "linear" }}
                    />
                  )}
                  {i < index && <span className="block h-full w-full bg-bone/60" />}
                </span>
              </button>
            ))}
          </div>

          <Link href="/shop?tag=new" className="group relative hidden h-32 w-32 shrink-0 md:block" aria-label="Shop new arrivals" data-cursor="Shop">
            <svg viewBox="0 0 100 100" className="h-full w-full animate-spin-slow">
              <defs>
                <path id="circle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
              </defs>
              <text className="fill-bone font-mono text-[9.5px] uppercase tracking-[0.3em]">
                <textPath href="#circle">New season • Shop the drop • SS26 •</textPath>
              </text>
            </svg>
            <span className="absolute inset-0 m-auto grid h-14 w-14 place-items-center rounded-full bg-volt text-ink transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-45">
              <ArrowRight className="h-5 w-5" />
            </span>
          </Link>
        </div>
      </motion.div>

      <motion.div
        style={{ opacity: fade }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-bone/60 lg:flex"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <motion.span animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
          <ArrowDown className="h-4 w-4" />
        </motion.span>
      </motion.div>
    </section>
  );
}
