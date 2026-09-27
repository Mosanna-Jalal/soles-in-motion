import Link from "next/link";
import { Quote, Star } from "lucide-react";
import { Marquee, Reveal, SplitText } from "@/components/motion/primitives";
import type { ReviewT } from "@/lib/types";

type T = ReviewT & { product: { name: string; slug: string } };

function Card({ r }: { r: T }) {
  return (
    <figure className="mx-2.5 flex w-[340px] shrink-0 flex-col justify-between rounded-3xl border border-line bg-ink-2 p-6 transition-colors hover:border-volt/50 sm:w-[400px]">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-volt text-volt" : "text-ink-4"}`} />
            ))}
          </div>
          <Quote className="h-6 w-6 text-ink-4" />
        </div>
        {r.title && <p className="mt-4 font-semibold">{r.title}</p>}
        <blockquote className="mt-2 line-clamp-4 text-sm leading-relaxed text-bone/75">{r.body}</blockquote>
      </div>
      <figcaption className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
        <span className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-volt font-bold text-ink">{r.name.charAt(0)}</span>
          <span className="font-semibold">{r.name}</span>
        </span>
        <Link href={`/product/${r.product.slug}`} className="line-clamp-1 max-w-[50%] text-right text-xs text-mist hover:text-volt">
          {r.product.name}
        </Link>
      </figcaption>
    </figure>
  );
}

export default function Testimonials({ reviews }: { reviews: T[] }) {
  if (reviews.length < 4) return null;
  const half = Math.ceil(reviews.length / 2);
  return (
    <section className="overflow-hidden py-24 sm:py-32">
      <div className="container-x mb-12 text-center">
        <Reveal>
          <p className="eyebrow text-volt">Word on the street</p>
        </Reveal>
        <SplitText as="h2" text="Loved by feet everywhere" className="display mt-3 block text-6xl sm:text-8xl" />
      </div>
      <div className="space-y-5 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
        <Marquee duration={60} pauseOnHover>
          {reviews.slice(0, half).map((r) => (
            <Card key={r._id} r={r} />
          ))}
        </Marquee>
        <Marquee duration={70} reverse pauseOnHover>
          {reviews.slice(half).map((r) => (
            <Card key={r._id} r={r} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
