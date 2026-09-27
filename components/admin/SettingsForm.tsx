"use client";

import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Field, Spinner } from "./ui";
import { api } from "@/lib/hooks";
import { formatINR } from "@/lib/utils";
import type { SettingsT } from "@/lib/types";

export default function SettingsForm({ settings }: { settings: SettingsT }) {
  const router = useRouter();
  const [f, setF] = useState({
    storeName: settings.storeName,
    tagline: settings.tagline,
    announcement: settings.announcement,
    shippingFee: String(settings.shippingFee),
    freeShippingThreshold: String(settings.freeShippingThreshold),
    taxRate: String(settings.taxRate),
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    address: settings.address,
    instagram: settings.instagram ?? "",
    youtube: settings.youtube ?? "",
    x: settings.x ?? "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <form
      className="grid gap-4 xl:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await api("/api/admin/settings", { method: "PUT", json: { ...f, shippingFee: Number(f.shippingFee), freeShippingThreshold: Number(f.freeShippingThreshold), taxRate: Number(f.taxRate) } });
          toast.success("Settings saved");
          router.refresh();
        } catch (err) {
          toast.error((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Card title="Store">
        <div className="grid gap-4">
          <Field label="Store name">
            <input required value={f.storeName} onChange={set("storeName")} className="field" />
          </Field>
          <Field label="Tagline">
            <input value={f.tagline} onChange={set("tagline")} className="field" />
          </Field>
          <Field label="Announcement bar" hint="Scrolls across the top of every store page.">
            <input value={f.announcement} onChange={set("announcement")} className="field" />
          </Field>
        </div>
      </Card>
      <Card title="Shipping & tax">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Shipping fee (₹)">
            <input type="number" min={0} value={f.shippingFee} onChange={set("shippingFee")} className="field" />
          </Field>
          <Field label="Free above (₹)">
            <input type="number" min={0} value={f.freeShippingThreshold} onChange={set("freeShippingThreshold")} className="field" />
          </Field>
          <Field label="GST rate (%)" hint="Prices include GST">
            <input type="number" min={0} max={50} value={f.taxRate} onChange={set("taxRate")} className="field" />
          </Field>
        </div>
        <p className="mt-4 rounded-xl bg-ink-3 px-4 py-3 text-sm text-mist">
          Orders under {formatINR(Number(f.freeShippingThreshold))} pay {formatINR(Number(f.shippingFee))} shipping. A {formatINR(4999)} order includes {formatINR(Math.round((4999 * Number(f.taxRate)) / (100 + Number(f.taxRate))))} GST.
        </p>
      </Card>
      <Card title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email">
            <input type="email" required value={f.contactEmail} onChange={set("contactEmail")} className="field" />
          </Field>
          <Field label="Phone">
            <input value={f.contactPhone} onChange={set("contactPhone")} className="field" />
          </Field>
          <Field label="Store address" className="sm:col-span-2">
            <input value={f.address} onChange={set("address")} className="field" />
          </Field>
        </div>
      </Card>
      <Card title="Social links">
        <div className="grid gap-4">
          <Field label="Instagram URL">
            <input value={f.instagram} onChange={set("instagram")} className="field" placeholder="https://instagram.com/…" />
          </Field>
          <Field label="YouTube URL">
            <input value={f.youtube} onChange={set("youtube")} className="field" />
          </Field>
          <Field label="X (Twitter) URL">
            <input value={f.x} onChange={set("x")} className="field" />
          </Field>
        </div>
      </Card>
      <div className="xl:col-span-2">
        <button disabled={busy} className="btn-volt">
          {busy ? <Spinner /> : <Save className="h-4 w-4" />} Save settings
        </button>
      </div>
    </form>
  );
}
