import { BadgeCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Counter, Stagger } from "@/components/motion/primitives";

export default function Values({ customers, products }: { customers: number; products: number }) {
  const items = [
    { icon: BadgeCheck, value: products, suffix: "+", label: "Styles in stock", note: "Curated from 10+ labels" },
    { icon: ShieldCheck, value: 100, suffix: "%", label: "Authentic", note: "Sourced direct. Always." },
    { icon: RotateCcw, value: 30, suffix: " days", label: "Free returns", note: "Easy exchanges on size" },
    { icon: Truck, value: customers, suffix: "+", label: "Happy customers", note: "Delivering pan-India" },
  ];
  return (
    <section className="border-y border-line bg-ink-2">
      <Stagger className="container-x grid grid-cols-2 divide-line lg:grid-cols-4 lg:divide-x">
        {items.map((it) => (
          <div key={it.label} className="group flex flex-col gap-4 px-2 py-10 sm:px-8 sm:py-14">
            <it.icon className="h-7 w-7 text-volt transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110" />
            <Counter to={it.value} suffix={it.suffix} className="display text-5xl sm:text-6xl" />
            <div>
              <p className="font-semibold">{it.label}</p>
              <p className="text-sm text-mist">{it.note}</p>
            </div>
          </div>
        ))}
      </Stagger>
    </section>
  );
}
