"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const dbMissing = error.message?.includes("MONGODB_URI");
  return (
    <div className="grid min-h-dvh place-items-center bg-ink px-6 text-center text-bone">
      <div className="max-w-lg">
        <p className="eyebrow text-ember">Something tripped</p>
        <h1 className="display mt-4 text-6xl sm:text-7xl">We missed a step</h1>
        <p className="mt-4 text-mist">
          {dbMissing
            ? "The database connection isn't configured yet. Add your Atlas credentials to MONGODB_URI in .env.local, then run `npm run seed`."
            : "An unexpected error occurred while loading this page. Please try again in a moment."}
        </p>
        {error.digest && <p className="mt-2 font-mono text-xs text-mist/60">Ref: {error.digest}</p>}
        <div className="mt-8 flex justify-center gap-3">
          <button onClick={reset} className="btn-volt">
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
          <Link href="/" className="btn-ghost">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
