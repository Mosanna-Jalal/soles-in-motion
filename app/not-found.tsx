import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-ink px-6 text-center">
      <div className="display pointer-events-none absolute inset-0 grid place-items-center text-[42vw] leading-none text-ink-3" aria-hidden>
        404
      </div>
      <div className="relative max-w-md">
        <p className="eyebrow text-volt">Page not found</p>
        <h1 className="display mt-4 text-6xl sm:text-7xl">Lost your sole?</h1>
        <p className="mt-4 text-mist">The page you&apos;re after has walked off. Let&apos;s get you back on track.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/shop" className="btn-volt">
            Shop all
          </Link>
          <Link href="/" className="btn-ghost">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
