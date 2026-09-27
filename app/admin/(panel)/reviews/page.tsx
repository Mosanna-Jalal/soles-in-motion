import Link from "next/link";
import ReviewsTable from "@/components/admin/ReviewsTable";
import { PageHeader } from "@/components/admin/ui";
import { connectDB, serialize } from "@/lib/db";
import { Review } from "@/lib/models";
import { cn } from "@/lib/utils";
import type { ReviewT } from "@/lib/types";

export const metadata = { title: "Reviews" };

export default async function ReviewsAdmin(props: PageProps<"/admin/reviews">) {
  const sp = await props.searchParams;
  const tab = sp.tab === "published" ? "published" : sp.tab === "all" ? "all" : "pending";
  await connectDB();
  const filter = tab === "all" ? {} : { approved: tab === "published" };
  const [reviews, pending, published] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).limit(100).populate("product", "name slug").lean(),
    Review.countDocuments({ approved: false }),
    Review.countDocuments({ approved: true }),
  ]);
  const tabs = [
    ["pending", "Awaiting approval", pending],
    ["published", "Published", published],
    ["all", "All", pending + published],
  ] as const;
  return (
    <>
      <PageHeader title="Reviews" subtitle="Customer reviews appear on product pages only after approval." />
      <div className="mb-4 flex gap-2">
        {tabs.map(([k, l, n]) => (
          <Link key={k} href={`/admin/reviews?tab=${k}`} className={cn("flex items-center gap-2 rounded-full border px-4 py-2 text-sm", tab === k ? "border-volt bg-volt font-semibold text-ink" : "border-line text-mist hover:text-bone")}>
            {l} <span className={cn("rounded-full px-1.5 font-mono text-[10px]", tab === k ? "bg-ink text-volt" : "bg-ink-3")}>{n}</span>
          </Link>
        ))}
      </div>
      <ReviewsTable reviews={serialize<ReviewT[]>(reviews)} />
    </>
  );
}
