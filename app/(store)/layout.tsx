import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import MobileMenu from "@/components/store/MobileMenu";
import SearchOverlay from "@/components/store/SearchOverlay";
import CartDrawer from "@/components/store/CartDrawer";
import SmoothScroll from "@/components/store/SmoothScroll";
import Cursor from "@/components/store/Cursor";
import Preloader from "@/components/store/Preloader";
import { ScrollProgress } from "@/components/motion/primitives";
import { getCategories, getSettings } from "@/lib/data";
import { getSession } from "@/lib/auth";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [settings, categories, user] = await Promise.all([getSettings(), getCategories(), getSession()]);

  return (
    <>
      <Preloader />
      <SmoothScroll />
      <Cursor />
      <ScrollProgress />
      <Header categories={categories} user={user} announcement={settings.announcement} />
      <MobileMenu categories={categories} user={user} />
      <SearchOverlay />
      <CartDrawer freeShippingThreshold={settings.freeShippingThreshold} />
      <main className="min-h-[70vh]">{children}</main>
      <Footer settings={settings} categories={categories} />
    </>
  );
}
