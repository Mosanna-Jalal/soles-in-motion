import type { Metadata } from "next";
import { Truck } from "lucide-react";
import TrackForm from "@/components/store/TrackForm";
import { SplitText } from "@/components/motion/primitives";

export const metadata: Metadata = { title: "Track your order" };

export default function TrackPage() {
  return (
    <div className="container-x grid gap-12 pb-10 pt-36 sm:pt-44 lg:grid-cols-2">
      <div>
        <p className="eyebrow flex items-center gap-2 text-volt">
          <Truck className="h-4 w-4" /> Order tracking
        </p>
        <SplitText as="h1" trigger="mount" text="Where are my kicks?" className="display mt-4 block text-7xl sm:text-8xl" />
        <p className="mt-6 max-w-md text-mist">
          Enter your order number (you&apos;ll find it in your confirmation) and the email you used at checkout to see live status updates.
        </p>
      </div>
      <div className="rounded-[28px] border border-line bg-ink-2 p-6 sm:p-10">
        <TrackForm />
      </div>
    </div>
  );
}
