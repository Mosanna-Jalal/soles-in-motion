/**
 * One-off migration: renames "Soles in Motion" → "Waquar Footwear" in existing data
 * and sets the Gaya store address + map pin. Safe to re-run (every step is idempotent).
 * Nothing is wiped and no media is touched.
 *
 *   npx tsx --env-file=.env.local scripts/migrate-rebrand.ts
 */
import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import { Banner, Category, Message, Order, Product, Review, Setting, User } from "../lib/models";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Server-side substring replace ($replaceAll) on one string field. */
async function replaceText(model: { collection: mongoose.mongo.Collection }, field: string, find: string, replacement: string) {
  const r = await model.collection.updateMany({ [field]: { $regex: escape(find) } }, [
    { $set: { [field]: { $replaceAll: { input: `$${field}`, find, replacement } } } },
  ]);
  return r.modifiedCount;
}

async function main() {
  await connectDB();
  console.log(`→ Connected to "${mongoose.connection.db?.databaseName}"`);
  const log = (label: string, n: number) => console.log(`  ${n ? "✓" : "·"} ${label}: ${n}`);

  // ── Store settings ──
  const s = await Setting.findOne({ key: "store" });
  if (s) {
    const updates: Record<string, unknown> = {};
    if (!s.storeName || s.storeName === "Soles in Motion") updates.storeName = "Waquar Footwear";
    if (!s.address || /fraser road|patna/i.test(s.address)) updates.address = "Main Road, Kathokar Talab, Gaya, Bihar 823001";
    if (!s.contactEmail || s.contactEmail.endsWith("@solesinmotion.in")) updates.contactEmail = "hello@waquarfootwear.in";
    if (!s.get("hours")) updates.hours = "Open daily · 11am – 9pm";
    if (typeof s.get("mapLat") !== "number") updates.mapLat = 24.79773;
    if (typeof s.get("mapLng") !== "number") updates.mapLng = 85.00462;
    s.set(updates);
    const changed = Object.keys(updates).length;
    await s.save();
    log("settings fields updated", changed);
  }

  // ── Catalogue ──
  log("products: house brand", (await Product.updateMany({ brand: "Soles Studio" }, { brand: "Waquar Studio" })).modifiedCount);
  log("products: brand tag", (await Product.updateMany({ tags: "soles studio" }, { $set: { "tags.$": "waquar studio" } })).modifiedCount);
  log("products: descriptions", await replaceText(Product, "description", "Soles in Motion", "Waquar Footwear"));
  log("categories: descriptions", await replaceText(Category, "description", "Soles Studio", "Waquar Studio"));

  // ── Banners ──
  log("hero eyebrow", await replaceText(Banner, "eyebrow", "The Motion Collection", "The New Season Edit"));
  log(
    "store banner",
    (
      await Banner.updateMany(
        { placement: "promo", eyebrow: "Flagship store" },
        {
          eyebrow: "Visit our store",
          subtitle: "Main Road, Kathokar Talab, Gaya. Walk in, try on, and find your fit.",
          ctaLabel: "Get directions",
          ctaHref: "/contact#map",
        },
      )
    ).modifiedCount,
  );

  // ── Reviews & inbox ──
  log("reviews: store name", await replaceText(Review, "body", "Soles in Motion", "Waquar Footwear"));
  log("reviews: Patna delivery", await replaceText(Review, "body", "Delivered to Patna in two days", "Delivered in just two days"));
  log("messages: Patna store", await replaceText(Message, "message", "the Patna store", "the Gaya store"));
  log("messages: Patna club", await replaceText(Message, "message", "running club in Patna", "running club in Gaya"));

  // ── Accounts ──
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@waquarfootwear.in").toLowerCase();
  for (const [from, to] of [
    ["admin@solesinmotion.in", adminEmail],
    ["demo@solesinmotion.in", "demo@waquarfootwear.in"],
  ]) {
    if (from === to || (await User.exists({ email: to }))) {
      log(`account ${to} (already present)`, 0);
      continue;
    }
    const r = await User.updateOne({ email: from }, { email: to });
    await Order.updateMany({ email: from }, { email: to });
    log(`account ${from} → ${to}`, r.modifiedCount);
  }

  console.log("\n✓ Rebrand migration complete");
}

main()
  .then(() => mongoose.disconnect())
  .catch(async (err) => {
    console.error("✗ Migration failed:", err);
    await mongoose.disconnect();
    process.exit(1);
  });
