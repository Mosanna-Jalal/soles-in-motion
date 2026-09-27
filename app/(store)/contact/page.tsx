import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import ContactForm from "@/components/store/ContactForm";
import { Reveal, SplitText } from "@/components/motion/primitives";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Contact us", description: "Questions about sizing, orders or our Patna flagship? We're here to help." };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const s = await getSettings();
  const info = [
    { icon: MapPin, label: "Flagship store", value: s.address },
    { icon: Phone, label: "Call or WhatsApp", value: s.contactPhone, href: `tel:${s.contactPhone.replace(/\s/g, "")}` },
    { icon: Mail, label: "Email", value: s.contactEmail, href: `mailto:${s.contactEmail}` },
    { icon: Clock, label: "Hours", value: "Mon–Sun · 11am – 9pm" },
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
                    <a href={i.href} className="mt-1 block font-semibold hover:text-volt">
                      {i.value}
                    </a>
                  ) : (
                    <p className="mt-1 font-semibold">{i.value}</p>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
          <Reveal delay={0.3}>
            <div className="overflow-hidden rounded-[24px] border border-line">
              <iframe
                title="Map to our flagship store"
                src={`https://www.google.com/maps?q=${encodeURIComponent(s.address)}&output=embed`}
                className="h-72 w-full grayscale invert-[0.92] hue-rotate-180"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <div className="rounded-[28px] border border-line bg-ink-2 p-6 sm:p-10">
            <p className="display text-4xl">Send us a message</p>
            <p className="mb-8 mt-2 text-mist">Sizing help, order questions, bulk enquiries or collaborations — we read everything.</p>
            <ContactForm />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
