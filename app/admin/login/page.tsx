import type { Metadata } from "next";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { Marquee } from "@/components/motion/primitives";
import Logo from "@/components/store/Logo";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

export default async function AdminLoginPage(props: PageProps<"/admin/login">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/admin") ? sp.next : "/admin";
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-ink px-4">
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-6 opacity-[0.06]" aria-hidden>
        {[0, 1, 2].map((i) => (
          <Marquee key={i} duration={40 + i * 10} reverse={i % 2 === 1}>
            <span className="display whitespace-nowrap px-6 text-[14vw] leading-none">Control room · Control room ·</span>
          </Marquee>
        ))}
      </div>
      <div className="relative w-full max-w-md rounded-[32px] border border-line bg-ink-2/90 p-8 backdrop-blur-xl sm:p-10">
        <div className="mb-8 flex items-center gap-3">
          <Logo compact />
          <div>
            <p className="display text-2xl leading-none">Waquar/Footwear</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-volt">Admin panel</p>
          </div>
        </div>
        <h1 className="display text-5xl">Sign in</h1>
        <p className="mb-8 mt-2 text-sm text-mist">Manage products, orders, media and everything in between.</p>
        <AdminLoginForm next={next} />
      </div>
    </div>
  );
}
