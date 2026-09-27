import type { Metadata } from "next";
import CartView from "@/components/store/CartView";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Your bag" };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const settings = await getSettings();
  return (
    <CartView
      pricing={{ shippingFee: settings.shippingFee, freeShippingThreshold: settings.freeShippingThreshold, taxRate: settings.taxRate }}
    />
  );
}
