import Newsletter from "@/components/store/Newsletter";
import { Marquee } from "@/components/motion/primitives";

export default function JoinCTA() {
  return (
    <section className="relative overflow-hidden bg-volt py-20 text-ink sm:py-28">
      <Marquee duration={25} className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-[0.07]">
        {Array.from({ length: 3 }).map((_, i) => (
          <span key={i} className="display px-6 text-[22vw] leading-none">
            Waquar Footwear ·
          </span>
        ))}
      </Marquee>
      <div className="container-x relative grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Members get more</p>
          <h2 className="display mt-4 text-6xl sm:text-8xl">
            10% off your
            <br /> first pair
          </h2>
        </div>
        <div className="lg:justify-self-end">
          <p className="mb-5 max-w-md text-lg font-medium text-ink/75">
            Sign up for early access to drops, restock alerts and member-only pricing. Use code <b>WELCOME10</b> at checkout.
          </p>
          <Newsletter tone="light" className="max-w-md" />
        </div>
      </div>
    </section>
  );
}
