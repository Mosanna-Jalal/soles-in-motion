import Link from "next/link";
import Newsletter from "./Newsletter";
import Socials from "./Socials";
import type { CategoryT, SettingsT } from "@/lib/types";

const WORD = "SOLES IN MOTION".split("");

export default function Footer({ settings, categories }: { settings: SettingsT; categories: CategoryT[] }) {
  const cols = [
    {
      title: "Shop",
      links: [
        ["/shop?tag=new", "New arrivals"],
        ["/shop?tag=bestseller", "Bestsellers"],
        ...categories.slice(0, 5).map((c) => [`/shop?category=${c.slug}`, c.name]),
        ["/shop?tag=sale", "Sale"],
      ],
    },
    {
      title: "Help",
      links: [
        ["/track", "Track your order"],
        ["/faq#shipping", "Shipping & delivery"],
        ["/faq#returns", "Returns & exchanges"],
        ["/faq#sizing", "Size guide"],
        ["/contact", "Contact us"],
      ],
    },
    {
      title: "Company",
      links: [
        ["/about", "Our story"],
        ["/contact", "Flagship store"],
        ["/account", "My account"],
        ["/wishlist", "Wishlist"],
      ],
    },
  ];

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-line bg-ink">
      <div className="container-x grid gap-14 py-16 lg:grid-cols-[1.2fr_2fr] lg:py-24">
        <div>
          <p className="eyebrow text-volt">The Motion List</p>
          <h3 className="display mt-4 text-5xl sm:text-6xl">
            Early drops.
            <br />
            <span className="text-outline">Zero spam.</span>
          </h3>
          <p className="mt-4 max-w-sm text-sm text-mist">
            Get first dibs on limited releases, restock alerts and member-only prices. Unsubscribe anytime.
          </p>
          <Newsletter className="mt-6 max-w-md" />
          <div className="mt-8">
            <Socials links={{ instagram: settings.instagram, youtube: settings.youtube, x: settings.x }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          {cols.map((c) => (
            <div key={c.title}>
              <p className="eyebrow mb-4 text-mist">{c.title}</p>
              <ul className="space-y-2.5">
                {c.links.map(([href, label]) => (
                  <li key={href + label}>
                    <Link href={href} className="text-sm text-bone/80 transition-colors hover:text-volt">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="col-span-2 sm:col-span-1">
            <p className="eyebrow mb-4 text-mist">Visit</p>
            <address className="space-y-2.5 text-sm not-italic text-bone/80">
              <p>{settings.address}</p>
              <p>
                <a href={`tel:${settings.contactPhone.replace(/\s/g, "")}`} className="hover:text-volt">
                  {settings.contactPhone}
                </a>
              </p>
              <p>
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-volt">
                  {settings.contactEmail}
                </a>
              </p>
              <p className="text-mist">Mon–Sun · 11am–9pm</p>
            </address>
          </div>
        </div>
      </div>

      <div className="container-x select-none" aria-hidden>
        <div className="display flex justify-between whitespace-nowrap text-[12.5vw] leading-[0.8] text-ink-3">
          {WORD.map((ch, i) =>
            ch === " " ? (
              <span key={i} className="w-[0.15em]" />
            ) : (
              <span key={i} className="inline-block transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-[0.12em] hover:text-volt">
                {ch}
              </span>
            ),
          )}
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-6 text-xs text-mist sm:flex-row">
          <p>
            © {new Date().getFullYear()} {settings.storeName}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-2 font-mono uppercase tracking-wider">
            {["UPI", "Visa", "Mastercard", "RuPay", "COD"].map((p) => (
              <span key={p} className="rounded-md border border-line px-2 py-1 text-[10px]">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
