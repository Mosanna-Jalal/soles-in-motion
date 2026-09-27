import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScrollWords from "@/components/store/ScrollWords";
import { Counter, ImageReveal, Parallax, Reveal, SplitText, Stagger } from "@/components/motion/primitives";
import { getBanners, getCategories, getStoreStats } from "@/lib/data";

export const metadata: Metadata = {
  title: "Our story",
  description: "From a 200 sq ft shop on Fraser Road to India's most-loved sneaker destination — this is Soles in Motion.",
};
export const dynamic = "force-dynamic";

const TIMELINE = [
  ["2019", "The first shelf", "A 200 sq ft store on Fraser Road, Patna, with 40 pairs and a lot of ambition."],
  ["2021", "Going online", "We launched pan-India delivery and shipped to 400+ pin codes in our first year."],
  ["2023", "Soles Studio", "Our in-house label was born — handcrafted formals and everyday sneakers designed in Bihar."],
  ["2026", "The Motion Collection", "A new flagship, free foot scanning and the widest curated edit we've ever carried."],
];

export default async function AboutPage() {
  const [cats, promos, stats] = await Promise.all([getCategories(), getBanners("promo"), getStoreStats()]);
  const store = promos.find((p) => p.media?.resourceType === "image")?.media?.url;
  const img = (slug: string) => cats.find((c) => c.slug === slug)?.image?.url;

  return (
    <div className="pb-10">
      <section className="container-x pt-36 sm:pt-44">
        <p className="eyebrow text-volt">Our story</p>
        <SplitText as="h1" trigger="mount" text="Built on footsteps" className="display mt-4 block text-[16vw] leading-[0.85] sm:text-[11vw]" />
      </section>

      <section className="container-x mt-16">
        <Parallax offset={90} className="h-[60vh] rounded-[32px] sm:h-[80vh]">
          {store && <Image src={store} alt="The Soles in Motion flagship store" fill priority sizes="100vw" className="object-cover" />}
        </Parallax>
      </section>

      <section className="container-x py-24 sm:py-36">
        <ScrollWords
          className="display text-4xl leading-[1.05] sm:text-6xl lg:text-7xl"
          highlight={["motion", "every", "patna"]}
          text="We started Soles in Motion because great shoes change how you move — and how you feel while you're moving. From a tiny shop in Patna we've grown into a home for runners, collectors, dreamers and everyone who believes every step deserves the right pair."
        />
      </section>

      <section className="border-y border-line bg-ink-2">
        <Stagger className="container-x grid grid-cols-2 gap-8 py-16 lg:grid-cols-4">
          {[
            [stats.products, "+", "Curated styles"],
            [stats.customers, "+", "Happy customers"],
            [cats.length, "", "Collections"],
            [30, " days", "Free returns"],
          ].map(([n, s, l]) => (
            <div key={l as string}>
              <Counter to={n as number} suffix={s as string} className="display text-6xl sm:text-7xl" />
              <p className="mt-2 text-mist">{l as string}</p>
            </div>
          ))}
        </Stagger>
      </section>

      <section className="container-x py-24 sm:py-32">
        <div className="grid gap-16 lg:grid-cols-2">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="eyebrow text-volt">Milestones</p>
            <SplitText as="h2" text="Seven years in motion" className="display mt-3 block text-6xl sm:text-7xl" />
            <div className="mt-10 grid grid-cols-2 gap-4">
              <ImageReveal className="aspect-[3/4] rounded-[24px]">
                {img("boots") && <Image src={img("boots")!} alt="" width={600} height={800} className="h-full w-full object-cover" />}
              </ImageReveal>
              <ImageReveal delay={0.15} className="mt-12 aspect-[3/4] rounded-[24px]">
                {img("formal") && <Image src={img("formal")!} alt="" width={600} height={800} className="h-full w-full object-cover" />}
              </ImageReveal>
            </div>
          </div>
          <ol className="relative border-l border-line pl-10">
            {TIMELINE.map(([year, title, body], i) => (
              <Reveal key={year} delay={i * 0.05} className="relative pb-16 last:pb-0">
                <span className="absolute -left-[47px] top-2 h-3.5 w-3.5 rounded-full bg-volt ring-8 ring-ink" />
                <p className="display text-7xl text-outline">{year}</p>
                <p className="mt-3 text-2xl font-bold">{title}</p>
                <p className="mt-2 max-w-md text-mist">{body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-x">
        <div className="relative overflow-hidden rounded-[32px] bg-volt p-10 text-ink sm:p-16">
          <p className="display max-w-3xl text-5xl sm:text-7xl">Find the pair that moves you.</p>
          <Link href="/shop" className="btn mt-8 bg-ink text-bone hover:bg-ember">
            Shop the collection <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
