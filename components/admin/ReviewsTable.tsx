"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Check, EyeOff, MessageSquareQuote, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Empty, Pill, Spinner, useConfirm } from "./ui";
import { api } from "@/lib/hooks";
import { cn, formatDate } from "@/lib/utils";
import type { ReviewT } from "@/lib/types";

export default function ReviewsTable({ reviews }: { reviews: ReviewT[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (r: ReviewT, method: "PATCH" | "DELETE", json?: object) => {
    setBusy(r._id);
    try {
      await api(`/api/admin/reviews/${r._id}`, { method, json });
      toast.success(method === "DELETE" ? "Review deleted" : (json as { approved: boolean }).approved ? "Review published" : "Review hidden");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (!reviews.length) return <Empty icon={MessageSquareQuote} title="Nothing here">No reviews match this filter.</Empty>;

  return (
    <ul className="space-y-3">
      <AnimatePresence initial={false}>
        {reviews.map((r, i) => {
          const product = typeof r.product === "object" ? r.product : null;
          return (
            <motion.li key={r._id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.03 } }} exit={{ opacity: 0, x: -40 }} className="rounded-3xl border border-line bg-ink-2 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-ink-4 font-bold text-volt">{r.name.charAt(0)}</span>
                  <div>
                    <p className="font-semibold">
                      {r.name}{" "}
                      <span className="ml-1 inline-flex align-middle">
                        {Array.from({ length: 5 }).map((_, k) => (
                          <Star key={k} className={cn("h-3.5 w-3.5", k < r.rating ? "fill-volt text-volt" : "text-ink-4")} />
                        ))}
                      </span>
                    </p>
                    <p className="text-xs text-mist">
                      {formatDate(r.createdAt)} · on{" "}
                      {product ? (
                        <Link href={`/product/${product.slug}`} target="_blank" className="text-bone hover:text-volt">
                          {product.name}
                        </Link>
                      ) : (
                        "deleted product"
                      )}
                    </p>
                  </div>
                </div>
                <Pill className={r.approved ? "bg-volt/15 text-volt ring-volt/30" : "bg-amber-400/15 text-amber-300 ring-amber-400/30"}>{r.approved ? "Published" : "Awaiting approval"}</Pill>
              </div>
              {r.title && <p className="mt-4 font-semibold">{r.title}</p>}
              <p className="mt-1 text-sm leading-relaxed text-bone/80">{r.body}</p>
              <div className="mt-4 flex gap-2">
                {busy === r._id ? (
                  <Spinner className="text-volt" />
                ) : (
                  <>
                    {r.approved ? (
                      <button onClick={() => act(r, "PATCH", { approved: false })} className="btn-ghost py-2 text-xs">
                        <EyeOff className="h-3.5 w-3.5" /> Hide
                      </button>
                    ) : (
                      <button onClick={() => act(r, "PATCH", { approved: true })} className="btn-volt py-2 text-xs">
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        if (await confirm({ title: "Delete review?", danger: true, confirmLabel: "Delete", body: `The review by ${r.name} will be permanently removed and the product rating recalculated.` })) act(r, "DELETE");
                      }}
                      className="btn border border-line py-2 text-xs text-mist hover:border-ember hover:text-ember"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </>
                )}
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
