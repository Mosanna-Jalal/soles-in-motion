import type { Metadata } from "next";
import CheckoutForm from "@/components/store/CheckoutForm";
import { getSettings } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [settings, session] = await Promise.all([getSettings(), getSession()]);
  let prefill = {};
  if (session) {
    await connectDB();
    const u = await User.findById(session.id, { name: 1, email: 1, phone: 1, addresses: 1 }).lean();
    if (u) {
      const a = u.addresses?.[0];
      prefill = {
        name: u.name,
        email: u.email,
        phone: u.phone ?? "",
        address: a ? { line1: a.line1 ?? "", line2: a.line2 ?? "", city: a.city ?? "", state: a.state ?? "", pincode: a.pincode ?? "" } : undefined,
      };
    }
  }
  return (
    <CheckoutForm
      signedIn={!!session}
      prefill={prefill}
      pricing={{ shippingFee: settings.shippingFee, freeShippingThreshold: settings.freeShippingThreshold, taxRate: settings.taxRate }}
    />
  );
}
