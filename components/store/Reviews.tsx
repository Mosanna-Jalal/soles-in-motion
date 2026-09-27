"use client";

import { AnimatePresence, motion } from "motion/react";
import { LoaderCircle, PenLine, Star, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/hooks";
import { cn, formatDate } from "@/lib/utils";
import type { ReviewT } from "@/lib/types";

function Stars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <span className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn(size, i < Math.round(value) ? "fill-volt text-volt" : "text-ink-4")} />
      ))}
    </span>
  );
}

function ReviewForm({ productId, onDone }: { productId: string; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [form, setForm] = useState({ name: "", title: "", body: "" });
  const [busy, setBusy] = useState(false);

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await api("/api/reviews", { method: "POST", json: { productId, rating, ...form } });
          toast.success("Thanks for your review!", { description: "It will appear once our team has approved it." });
          onDone();
        } catch (err) {
          toast.error((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="mt-6 grid gap-4 rounded-3xl border border-line bg-ink-2 p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <span className="label">Your rating</span>
          <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Star className={cn("h-8 w-8 transition-transform hover:scale-110", n <= (hover || rating) ? "fill-volt text-volt" : "text-ink-4")} />
              </button>
            ))}
          </div>
        </div>
        <label>
          <span className="label">Name</span>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" />
        </label>
        <label>
          <span className="label">Headline</span>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="field" placeholder="Optional" />
        </label>
        <label className="sm:col-span-2">
          <span className="label">Review</span>
          <textarea required minLength={10} rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="field resize-none" placeholder="How's the fit, comfort and quality?" />
        </label>
        <div className="sm:col-span-2">
          <button disabled={busy} className="btn-volt">
            {busy && <LoaderCircle className="h-4 w-4 animate-spin" />} Submit review
          </button>
        </div>
      </div>
    </motion.form>
  );
}

export default function Reviews({ productId, reviews, rating }: { productId: string; reviews: ReviewT[]; rating: number }) {
  const [writing, setWriting] = useState(false);
  const [limit, setLimit] = useState(4);
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((r) => r.rating === n).length }));
  const max = Math.max(1, ...dist.map((d) => d.count));

  return (
    <section id="reviews" className="container-x scroll-mt-28 py-20">
      <div className="grid gap-12 lg:grid-cols-[360px_1fr]">
        <div>
          <p className="eyebrow text-volt">Reviews</p>
          <h2 className="display mt-3 text-6xl">What people say</h2>
          <div className="mt-8 flex items-end gap-4">
            <span className="display text-8xl leading-none">{rating ? rating.toFixed(1) : "—"}</span>
            <div className="pb-2">
              <Stars value={rating} />
              <p className="mt-1 text-sm text-mist">{reviews.length} verified reviews</p>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            {dist.map((d) => (
              <div key={d.n} className="flex items-center gap-3 text-sm">
                <span className="w-3 font-mono">{d.n}</span>
                <Star className="h-3.5 w-3.5 fill-volt text-volt" />
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-3">
                  <motion.div
                    className="h-full rounded-full bg-volt"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(d.count / max) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className="w-6 text-right font-mono text-mist">{d.count}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setWriting((w) => !w)} className="btn-ghost mt-8 w-full">
            {writing ? <X className="h-4 w-4" /> : <PenLine className="h-4 w-4" />} {writing ? "Cancel" : "Write a review"}
          </button>
        </div>

        <div>
          <AnimatePresence>{writing && <ReviewForm productId={productId} onDone={() => setWriting(false)} />}</AnimatePresence>
          {reviews.length === 0 ? (
            <p className="mt-6 rounded-3xl border border-dashed border-line p-10 text-center text-mist">No reviews yet — be the first to share your thoughts.</p>
          ) : (
            <ul className="mt-6 divide-y divide-line">
              {reviews.slice(0, limit).map((r, i) => (
                <motion.li
                  key={r._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 4) * 0.06 }}
                  className="py-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-ink-3 font-bold text-volt">{r.name.charAt(0)}</span>
                      <div>
                        <p className="font-semibold">{r.name}</p>
                        <p className="text-xs text-mist">Verified buyer · {formatDate(r.createdAt)}</p>
                      </div>
                    </div>
                    <Stars value={r.rating} />
                  </div>
                  {r.title && <p className="mt-4 font-semibold">{r.title}</p>}
                  <p className="mt-1 leading-relaxed text-bone/75">{r.body}</p>
                </motion.li>
              ))}
            </ul>
          )}
          {limit < reviews.length && (
            <button onClick={() => setLimit((l) => l + 6)} className="btn-ghost mt-4">
              Show more reviews
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
