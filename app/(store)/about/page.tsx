import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Banknote, Footprints, RotateCcw, Truck } from "lucide-react";
import ScrollWords from "@/components/store/ScrollWords";
import { Counter, ImageReveal, Parallax, Reveal, SplitText, Stagger } from "@/components/motion/primitives";
import { getBanners, getCategories, getSettings, getStoreStats } from "@/lib/data";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About us",
  description: "Waquar Footwear — sneakers, running shoes, formals, boots, heels and sandals on Main Road, Kathokar Talab, Gaya.",
};
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [cats, promos, stats, settings] = await Promise.all([getCategories(), getBanners("promo"), getStoreStats(), getSettings()]);
  const store = promos.find((p) => p.media?.resourceType === "image")?.media?.url;
  const img = (slug: string) => cats.find((c) => c.slug === slug)?.image?.url;

  const reasons = [
    { icon: Footprints, title: "Try before you buy", body: `Visit us on ${settings.address.split(",").slice(0, 2).join(",")} and try on any pair in person.` },
    { icon: Banknote, title: "Cash on delivery", body: "Order online and pay when your shoes arrive — UPI and cards work too." },
    { icon: Truck, title: `Free shipping over ${formatINR(settings.freeShippingThreshold)}`, body: "Quick dispatch, with every order tracked from our store to your door." },
    { icon: RotateCcw, title: "Easy returns", body: "Wrong size? Exchanges and returns are simple — just get in touch." },
  ];

  return (
    <div className="pb-10">
      <section className="container-x pt-36 sm:pt-44">
        <p className="eyebrow text-volt">About us</p>
        <SplitText as="h1" trigger="mount" text="Footwear for every step" className="display mt-4 block text-[16vw] leading-[0.85] sm:text-[11vw]" />
      </section>

      <section className="container-x mt-16">
        <Parallax offset={90} className="h-[60vh] rounded-[32px] sm:h-[80vh]">
          {store && <Image src={store} alt={`Inside ${settings.storeName}`} fill priority sizes="100vw" className="object-cover" />}
        </Parallax>
      </section>

      <section className="container-x py-24 sm:py-36">
        <ScrollWords
          className="display text-4xl leading-[1.05] sm:text-6xl lg:text-7xl"
          highlight={["waquar", "gaya", "fit"]}
          text="Waquar Footwear is a shoe store on Main Road, Kathokar Talab in Gaya. From sneakers and running shoes to formals, boots, heels and sandals, we help every customer find the right fit at the right price — and now the whole collection is online too."
        />
      </section>

      <section className="border-y border-line bg-ink-2">
        <Stagger className="container-x grid grid-cols-2 gap-8 py-16 lg:grid-cols-4">
          {[
            [stats.products, "+", "Styles in stock"],
            [stats.customers, "+", "Happy customers"],
            [cats.length, "", "Collections"],
            [30, " days", "Easy returns"],
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
            <p className="eyebrow text-volt">Why shop with us</p>
            <SplitText as="h2" text="Made simple, from shelf to doorstep" className="display mt-3 block text-6xl sm:text-7xl" />
            <div className="mt-10 grid grid-cols-2 gap-4">
              <ImageReveal className="aspect-[3/4] rounded-[24px]">
                {img("sneakers") && <Image src={img("sneakers")!} alt="" width={600} height={800} className="h-full w-full object-cover" />}
              </ImageReveal>
              <ImageReveal delay={0.15} className="mt-12 aspect-[3/4] rounded-[24px]">
                {img("formal") && <Image src={img("formal")!} alt="" width={600} height={800} className="h-full w-full object-cover" />}
              </ImageReveal>
            </div>
          </div>
          <div className="space-y-4">
            {reasons.map((r, i) => (
              <Reveal key={r.title} delay={i * 0.06}>
                <div className="flex gap-5 rounded-[28px] border border-line bg-ink-2 p-6 sm:p-8">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-volt text-ink">
                    <r.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-2xl font-bold">{r.title}</p>
                    <p className="mt-2 text-mist">{r.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x">
        <div className="relative overflow-hidden rounded-[32px] bg-volt p-10 text-ink sm:p-16">
          <p className="display max-w-3xl text-5xl sm:text-7xl">Find the pair that moves you.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="btn bg-ink text-bone hover:bg-ember">
              Shop the collection <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact#map" className="btn border border-ink/30 text-ink hover:bg-ink hover:text-bone">
              Visit the store
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
