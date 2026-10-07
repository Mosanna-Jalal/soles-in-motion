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
    default: "Waquar Footwear — Shoes, Sneakers & Sandals in Gaya",
    template: "%s · Waquar Footwear",
  },
  description:
    "Waquar Footwear, Main Road, Kathokar Talab, Gaya — sneakers, running shoes, boots, formals, heels and sandals. Shop online with cash on delivery, or visit the store.",
  openGraph: {
    type: "website",
    siteName: "Waquar Footwear",
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
