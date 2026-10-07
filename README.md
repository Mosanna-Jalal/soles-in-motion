# Waquar Footwear

Online store and admin panel for **Waquar Footwear**, Main Road, Kathokar Talab, Gaya, Bihar 823001. It runs on Next.js 16 (App Router), MongoDB and Cloudinary.

> The repository, database (`soles-in-motion`) and Cloudinary folder keep the project's original working name. Renaming them would disconnect existing data and media, and customers never see them.

## Features

**Storefront**
- Animated home page: intro preloader, Cloudinary video hero slider, scroll-velocity marquee, pinned horizontal "drop" gallery, category bento, product spotlight, expanding promo video, drag carousel, testimonials and newsletter.
- Shop with filters (category, gender, size, price, brand, highlights), sorting and pagination.
- Product pages with a zoomable gallery and product video, size and stock logic, delivery estimates, reviews and related products.
- Cart drawer and cart page with live price/stock sync and coupons. Checkout supports COD and demo UPI/card payments.
- Order confirmation with a status timeline, order tracking by number and email, customer accounts, wishlist, and About, Contact and FAQ pages.
- **Store map**: an interactive map (MapLibre + free OpenFreeMap/OpenStreetMap tiles, no API key) on the Contact page and home page, with a pin at Kathokar Talab and Google Maps directions links. The pin, address and opening hours are edited in *Admin → Settings*.
- Smooth scrolling (Lenis), a custom cursor, page-transition curtains, split-text reveals, magnetic buttons and 3D tilt cards. All motion respects `prefers-reduced-motion`.

**Admin (`/admin`)**
- Dashboard with revenue for the last 30 days, orders by status, sales by collection, top products, low stock and recent orders.
- Products: create/edit with signed direct uploads to Cloudinary (progress bars, drag to reorder, cover image, video), sizes and stock, colours, highlights and visibility toggles.
- Categories, banners (hero slides and promos, image or video), coupons, orders (fulfilment workflow, cancellation with automatic restock), customers, review moderation, inbox and newsletter (CSV export), and store settings.
- **Media library**: lists every Cloudinary asset the store owns, shows where each one is used, and purges unused files.

## Cloudinary: no stale files

Every stored image or video belongs to exactly one field on one document. When that reference goes away, the file is deleted from Cloudinary:

| Action | What happens on Cloudinary |
|---|---|
| Remove an image in the product/category/banner form, then save | The server compares old and new media and deletes the removed files |
| Delete a product, category or banner | All of its media is deleted |
| Upload a file, then remove it before saving | Deleted immediately |
| Leave or cancel a form with unsaved uploads | Deleted via `sendBeacon` when the page unloads or the form unmounts |
| Anything missed (e.g. a browser crash mid-upload) | Shown as **Unused** in *Admin → Media library*, where it can be purged |

Safety rails:
- Files still used by a document are never deleted.
- A bulk purge skips files uploaded in the last hour.
- **The Cloudinary account is shared with other projects.** Everything is scoped to the `soles-in-motion/` folder *and* the `soles-in-motion` tag, so assets from other projects are never listed or touched.

## Setup

```bash
npm install
```

1. Open `.env.local` and set `MONGODB_URI`, replacing `<db_user>:<db_password>` with your Atlas credentials. Cloudinary, JWT and admin credentials are already filled in. Data is written to the `soles-in-motion` database (`MONGODB_DB`).
2. Seed the catalogue:
   ```bash
   npm run seed
   ```
   This creates 8 categories, 56 products, reviews, 96 historical orders, customers, coupons, banners and store settings.
   - Media comes from Unsplash (photos) and Mixkit (videos) and is stored on Cloudinary under `soles-in-motion/seed/`.
   - Public IDs are derived from the source URL, so re-running the seed reuses existing uploads instead of duplicating them.
   - The seed wipes these collections first. The admin user is upserted, not duplicated.
3. Run the app:
   ```bash
   npm run dev
   ```
   - Store: http://localhost:3000
   - Admin: http://localhost:3000/admin, signed in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env.local`
   - Demo customer: `demo@waquarfootwear.in` / `Demo@12345`
   - Coupons: `WELCOME10`, `SOLE500` (orders ≥ ₹4,999), `MOTION20` (orders ≥ ₹9,999)

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`.

`npm install` also runs a `postinstall` step that copies MapLibre's web worker into `public/vendor/` (git-ignored), so the map loads it from the site itself.

`scripts/migrate-rebrand.ts` is the one-off migration that renamed existing data from the old working name. It has already been applied and is safe to re-run.

## Before going live

- **Payments:** UPI and card are simulated (the order is marked as paid). Integrate a gateway such as Razorpay in `lib/orders.ts` / `app/api/orders` before launch.
- **Emails:** order confirmations and contact replies are not emailed. Add a provider (e.g. Resend) if needed.
- **Secrets:** use a new `JWT_SECRET` and `ADMIN_PASSWORD` in production. The Cloudinary secret was shared in plain text during setup, so consider rotating it.
- **Store details:** the phone number, email (`hello@waquarfootwear.in`) and opening hours are placeholders. Set the real ones in *Admin → Settings*, and fine-tune the map pin there if needed.
- **Demo data:** the seeded reviews, orders, customers and inbox messages are samples. Clear them before launch so they aren't shown as real.
- **Site URL:** set `NEXT_PUBLIC_SITE_URL` to your domain; it is used by the sitemap, robots.txt and Open Graph tags.
- **Deploying:** on Vercel, add the variables from `.env.example`.

## Project structure

```
app/
  (store)/          storefront routes (home, shop, product, cart, checkout, order, account…)
  admin/login       admin sign-in
  admin/(panel)/    admin pages behind requireAdminPage()
  api/              route handlers (public + /api/admin/*)
components/
  home/             home page sections
  store/            storefront components
  admin/            admin UI, MediaUploader, forms
  motion/           animation primitives (Reveal, SplitText, Magnetic, Tilt, Marquee…)
lib/
  models/           Mongoose schemas
  cloudinary.ts     signing, scoped listing and deletion
  media-refs.ts     reference checks and deletion of unreferenced media
  orders.ts         atomic stock reservation, coupons, restock
  data.ts           storefront queries
proxy.ts            route protection (Next 16's replacement for middleware)
scripts/seed.ts     demo data + Cloudinary media
```

Media credits: photos from [Unsplash](https://unsplash.com) (Unsplash License) and videos from [Mixkit](https://mixkit.co) (Mixkit License). Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, tiles by [OpenFreeMap](https://openfreemap.org).
