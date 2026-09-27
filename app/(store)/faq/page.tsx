import type { Metadata } from "next";
import Link from "next/link";
import FaqList from "@/components/store/FaqList";
import { SplitText } from "@/components/motion/primitives";

export const metadata: Metadata = { title: "Help & FAQ", description: "Shipping, returns, sizing and payments at Soles in Motion." };

const SECTIONS = [
  {
    id: "shipping",
    title: "Shipping & delivery",
    items: [
      ["How long does delivery take?", "Orders are dispatched within 24–48 hours. Metro cities typically receive deliveries in 2–3 working days and the rest of India in 4–6 working days."],
      ["Is shipping free?", "Shipping is free on all orders over ₹2,999. Below that, a flat ₹149 fee applies."],
      ["Do you offer cash on delivery?", "Yes — COD is available across India on all orders."],
    ],
  },
  {
    id: "returns",
    title: "Returns & exchanges",
    items: [
      ["What is your return policy?", "You can return or exchange any unworn pair within 30 days of delivery. Shoes must be in their original box with tags attached."],
      ["How do I exchange a size?", "Contact us with your order number and the size you need. We'll arrange a free pickup and ship the new size as soon as the original is on its way back."],
      ["When will I get my refund?", "Refunds are issued to the original payment method within 5–7 working days after we receive the return. COD orders are refunded by bank transfer."],
    ],
  },
  {
    id: "sizing",
    title: "Sizing",
    items: [
      ["Which size system do you use?", "All sizes are listed in UK sizing. As a guide: UK 6 ≈ EU 40 ≈ US 7 (men) / US 8.5 (women). UK 8 ≈ EU 42 ≈ US 9 (men)."],
      ["How do I find my size?", "Measure your foot from heel to longest toe in cm. 25cm ≈ UK 6, 26cm ≈ UK 7, 27cm ≈ UK 8, 28cm ≈ UK 9, 29cm ≈ UK 10. Between sizes? Go half a size up for running shoes."],
      ["Do different brands fit differently?", "Slightly. Jordan and Nike Air Force 1 run about half a size large, New Balance runs true to size, and Vans/Converse run slightly long. Our product pages note any special fit advice."],
    ],
  },
  {
    id: "payments",
    title: "Orders & payments",
    items: [
      ["Which payment methods do you accept?", "UPI, all major debit/credit cards (Visa, Mastercard, RuPay) and cash on delivery."],
      ["Are your products authentic?", "100%. We source directly from brands and authorised distributors. Every pair ships with a Soles in Motion authenticity card."],
      ["How can I track my order?", "Use the tracking page with your order number and email, or sign in to your account to see all your orders."],
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="container-x pb-10 pt-36 sm:pt-44">
      <p className="eyebrow text-volt">Help centre</p>
      <SplitText as="h1" trigger="mount" text="Questions? Answered." className="display mt-4 block text-7xl sm:text-9xl" />
      <div className="mt-14 grid gap-12 lg:grid-cols-[240px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:sticky lg:top-32 lg:flex-col lg:self-start">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="shrink-0 rounded-full border border-line px-4 py-2 text-sm hover:border-volt hover:text-volt lg:rounded-xl">
              {s.title}
            </a>
          ))}
          <Link href="/contact" className="shrink-0 rounded-full bg-volt px-4 py-2 text-sm font-semibold text-ink lg:mt-4 lg:rounded-xl">
            Still stuck? Contact us
          </Link>
        </nav>
        <div className="space-y-16">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-32">
              <h2 className="display text-5xl">{s.title}</h2>
              <FaqList items={s.items as [string, string][]} />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
