"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";

export default function AdminSearch({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  return (
    <form
      className="relative w-full sm:w-80"
      onSubmit={(e) => {
        e.preventDefault();
        const next = new URLSearchParams(params);
        if (q) next.set("q", q);
        else next.delete("q");
        next.delete("page");
        router.push(`${pathname}?${next}`);
      }}
    >
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="field py-2.5 pl-10" />
    </form>
  );
}
