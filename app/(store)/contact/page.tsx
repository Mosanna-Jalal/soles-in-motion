import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import ContactForm from "@/components/store/ContactForm";
import StoreMap from "@/components/store/StoreMap";
import { mapLinks } from "@/lib/maps";
import { Reveal, SplitText } from "@/components/motion/primitives";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Contact us", description: "Questions about sizing, orders or our store on Main Road, Kathokar Talab, Gaya? We're here to help." };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const s = await getSettings();
  const info = [
    { icon: MapPin, label: "Our store", value: s.address, href: mapLinks(s.mapLat, s.mapLng).open, external: true },
    { icon: Phone, label: "Call or WhatsApp", value: s.contactPhone, href: `tel:${s.contactPhone.replace(/\s/g, "")}` },
    { icon: Mail, label: "Email", value: s.contactEmail, href: `mailto:${s.contactEmail}` },
    { icon: Clock, label: "Hours", value: s.hours },
  ];
  return (
    <div className="container-x pb-10 pt-36 sm:pt-44">
      <p className="eyebrow text-volt">Contact</p>
      <SplitText as="h1" trigger="mount" text="Let's talk shoes" className="display mt-4 block text-7xl sm:text-9xl" />
      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          {info.map((i, k) => (
            <Reveal key={i.label} delay={k * 0.06}>
              <div className="flex items-start gap-4 rounded-[24px] border border-line bg-ink-2 p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-volt text-ink">
                  <i.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="eyebrow text-mist">{i.label}</p>
                  {i.href ? (
                    <a href={i.href} {...(i.external && { target: "_blank", rel: "noreferrer" })} className="mt-1 block font-semibold hover:text-volt">
                      {i.value}
                    </a>
                  ) : (
                    <p className="mt-1 font-semibold">{i.value}</p>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1}>
          <div className="rounded-[28px] border border-line bg-ink-2 p-6 sm:p-10">
            <p className="display text-4xl">Send us a message</p>
            <p className="mb-8 mt-2 text-mist">Sizing help, order questions, bulk enquiries or collaborations — we read everything.</p>
            <ContactForm />
          </div>
        </Reveal>
      </div>

      <section id="map" className="mt-16 scroll-mt-28">
        <Reveal>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <h2 className="display text-5xl sm:text-6xl">Visit the store</h2>
            <p className="max-w-md text-mist">Walk in, try on, and find your fit — we&apos;re on Main Road, Kathokar Talab in Gaya.</p>
          </div>
        </Reveal>
        <StoreMap lat={s.mapLat} lng={s.mapLng} name={s.storeName} address={s.address} hours={s.hours} className="h-[65vh] min-h-[460px]" />
      </section>
    </div>
  );
}
