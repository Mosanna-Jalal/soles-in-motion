import type { Metadata, Viewport } from "next";
import { Anton, JetBrains_Mono, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Soles in Motion — Sneakers, Running & Designer Footwear",
    template: "%s · Soles in Motion",
  },
  description:
    "Soles in Motion is India's home for iconic sneakers, performance running shoes, boots, heels and handcrafted formals. Free shipping over ₹2,999 and 30-day returns.",
  openGraph: {
    type: "website",
    siteName: "Soles in Motion",
    locale: "en_IN",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${anton.variable} ${manrope.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh bg-ink text-bone">
        {children}
        <Toaster
          theme="dark"
          position="bottom-center"
          toastOptions={{
            classNames: {
              toast: "!bg-ink-3 !border !border-line !text-bone !rounded-2xl !font-sans",
              description: "!text-mist",
            },
          }}
        />
      </body>
    </html>
  );
}
