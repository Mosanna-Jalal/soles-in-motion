/**
 * Seeds the soles-in-motion database with a complete demo catalogue.
 *
 *   npm run seed
 *
 * - Media comes from free sources (Unsplash photos, Mixkit videos) and is uploaded to
 *   Cloudinary under `${CLOUDINARY_FOLDER}/seed/...` with deterministic public IDs, so
 *   re-running never duplicates assets.
 * - All seeded collections are wiped first (the admin user is upserted, not duplicated).
 * - Finally, any project asset in Cloudinary that no document references is deleted,
 *   so nothing stale is left behind.
 */
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import { cloudinary, CLD_ROOT, CLD_TAG, destroyAssets, listProjectAssets } from "../lib/cloudinary";
import { getMediaUsage } from "../lib/media-refs";
import { Banner, Category, Coupon, Message, Order, Product, Review, Setting, Subscriber, User } from "../lib/models";
import { computeTotals } from "../lib/pricing";
import type { Media } from "../lib/types";

// ─── deterministic randomness ──────────────────────────────────────────────
let seed = 20260927;
function rand() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

// ─── media sources ─────────────────────────────────────────────────────────
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?w=1600&q=80&fm=jpg`;
const unsplashDetail = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1400&h=1400&q=80&fm=jpg&fit=crop&crop=focalpoint&fp-z=1.8&fp-x=0.5&fp-y=0.55`;
const mixkit = (id: number) => `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`;

async function upload(path: string, url: string, resourceType: "image" | "video" = "image", alt?: string): Promise<Media> {
  // The source URL hash is part of the id: re-runs reuse existing uploads, while a changed
  // source becomes a new asset (and the old one is removed by the orphan purge below).
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 6);
  const publicId = `${CLD_ROOT}/seed/${path}-${hash}`;
  const folder = publicId.split("/").slice(0, -1).join("/");
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await cloudinary.uploader.upload(url, {
        public_id: publicId,
        asset_folder: folder,
        resource_type: resourceType,
        tags: [CLD_TAG, "seed"],
        overwrite: false,
        unique_filename: false,
      });
      return {
        url: r.secure_url,
        publicId: r.public_id,
        resourceType,
        width: r.width,
        height: r.height,
        format: r.format,
        bytes: r.bytes,
        alt,
      };
    } catch (err) {
      if (attempt >= 3) throw new Error(`Upload failed for ${path}: ${(err as { message?: string }).message ?? err}`);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

async function pool<T, R>(items: T[], size: number, fn: (item: T, i: number) => Promise<R>) {
  const out: R[] = new Array(items.length);
  let next = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
        done++;
        if (done % 10 === 0 || done === items.length) process.stdout.write(`  uploaded ${done}/${items.length}\r`);
      }
    }),
  );
  process.stdout.write("\n");
  return out;
}

// ─── catalogue ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  { slug: "sneakers", name: "Sneakers", tagline: "Street-ready icons", image: "1514989940723-e8e51635b782" },
  { slug: "running", name: "Running", tagline: "Built for the long run", image: "1571008887538-b36bb32f4571" },
  { slug: "basketball", name: "Basketball", tagline: "Own the hardwood", image: "1575537302964-96cd47c06b1b" },
  { slug: "training", name: "Training", tagline: "Lift. Sweat. Repeat.", image: "1517836357463-d25dfeac3438" },
  { slug: "boots", name: "Boots", tagline: "Rugged, refined, ready", image: "1520639888713-7851133b1ed0" },
  { slug: "formal", name: "Formal", tagline: "Boardroom to banquet", image: "1533867617858-e7b97e060509" },
  { slug: "heels", name: "Heels", tagline: "Elevate every entrance", image: "1554062614-6da4fa67725a" },
  { slug: "sandals-flats", name: "Sandals & Flats", tagline: "Easy summer ease", image: "1603487742131-4160ec999306" },
] as const;

type CatSlug = (typeof CATEGORIES)[number]["slug"];
type G = "men" | "women" | "unisex";

interface Def {
  slug: string;
  name: string;
  brand: string;
  cat: CatSlug;
  g: G;
  price: number;
  was?: number;
  img: string[];
  detail?: boolean;
  colors: [string, string][];
  flags?: ("featured" | "new" | "best")[];
  video?: number;
  line: string;
}

const P: Def[] = [
  // Sneakers
  { slug: "air-force-1-07-triple-white", name: "Air Force 1 '07 Triple White", brand: "Nike", cat: "sneakers", g: "unisex", price: 7495, img: ["1600269452121-4f2416e55c28", "1579338559194-a162d19bf842"], colors: [["Triple White", "#f4f3ee"]], flags: ["best", "featured"], line: "The court legend that became a street staple — crisp full-grain leather and that unmistakable Air cushioning." },
  { slug: "air-force-1-lv8-wheat", name: "Air Force 1 '07 LV8 Wheat", brand: "Nike", cat: "sneakers", g: "men", price: 9695, was: 10795, img: ["1549298916-b41d501d3772"], detail: true, colors: [["Wheat", "#c68a44"], ["Gum", "#8b5a2b"]], line: "Nubuck in a warm wheat tone with a gum outsole — built for cold mornings and warm company." },
  { slug: "air-force-1-shadow-pastel", name: "Air Force 1 Shadow Pastel", brand: "Nike", cat: "sneakers", g: "women", price: 9995, img: ["1595950653106-6c9ebd614d3a"], detail: true, colors: [["Pastel Multi", "#e9c9e8"]], flags: ["new"], line: "Double the heritage: layered overlays, a stacked midsole and a candy-soft pastel palette." },
  { slug: "air-force-1-utility-black", name: "Air Force 1 Utility Black", brand: "Nike", cat: "sneakers", g: "men", price: 8695, img: ["1543508282-6319a3e2621f"], detail: true, colors: [["Black", "#111111"]], line: "Utility straps, toggle lacing and a stealthy all-black upper ready for any mission." },
  { slug: "air-force-1-low-canary", name: "Air Force 1 Low Canary", brand: "Nike", cat: "sneakers", g: "unisex", price: 8995, img: ["1628253747716-0c4f5c90fdda"], detail: true, colors: [["Canary", "#f7c600"]], flags: ["new"], line: "A loud, sunshine-yellow take on the icon with reflective 'AIR' hits on the midsole." },
  { slug: "air-force-1-high-07", name: "Air Force 1 High '07", brand: "Nike", cat: "sneakers", g: "men", price: 9295, img: ["1512374382149-233c42b6a83b"], detail: true, colors: [["White", "#f5f5f5"]], line: "The high-top original with its signature ankle strap — pure, clean, timeless." },
  { slug: "air-max-1-sunrise", name: "Air Max 1 Sunrise", brand: "Nike", cat: "sneakers", g: "unisex", price: 11895, was: 12995, img: ["1600185365483-26d7a4cc7519", "1600185365926-3a2ce3cdb9eb", "1600185365778-7875a359b924"], colors: [["Sunrise", "#ff6b3d"], ["Sail", "#efe9dc"]], flags: ["featured", "best"], line: "Visible Air that started a revolution, dressed in a sunrise-orange colourway." },
  { slug: "air-max-90-sunset-pop", name: "Air Max 90 Sunset Pop", brand: "Nike", cat: "sneakers", g: "men", price: 12995, img: ["1514989940723-e8e51635b782"], detail: true, colors: [["Sunset", "#f28c28"], ["Royal", "#2f55d4"]], flags: ["featured"], line: "Waffle outsole, visible Air and a colour-blocked upper that turns every pavement into a runway." },
  { slug: "air-max-90-pink-rush", name: "Air Max 90 Pink Rush", brand: "Nike", cat: "sneakers", g: "women", price: 11495, was: 12995, img: ["1511556532299-8f662fc26c06"], detail: true, colors: [["Pink Rush", "#ff4fa3"]], line: "Grey suede, hyper-pink accents and plush Max Air in the heel." },
  { slug: "air-jordan-1-retro-high-bred", name: "Air Jordan 1 Retro High 'Bred'", brand: "Jordan", cat: "sneakers", g: "men", price: 16995, img: ["1552346154-21d32810aba3", "1571601035754-5c927f2d7edc", "1611510338559-2f463335092c"], colors: [["Black / Varsity Red", "#c8102e"]], flags: ["featured", "best"], line: "The shoe that was 'banned' — premium leather in the colours that started it all." },
  { slug: "air-jordan-1-mid-chicago-toe", name: "Air Jordan 1 Mid 'Chicago Toe'", brand: "Jordan", cat: "sneakers", g: "men", price: 11295, img: ["1597045566677-8cf032ed6634", "1556906781-9a412961c28c", "1600181516264-3ea807ff44b9"], colors: [["Chicago", "#d62828"]], flags: ["best"], line: "Mid-cut comfort with the Chicago red toe box and black Swoosh." },
  { slug: "air-jordan-1-royal-flyknit", name: "Air Jordan 1 Retro 'Royal Flyknit'", brand: "Jordan", cat: "sneakers", g: "men", price: 15495, img: ["1603787081207-362bcef7c144", "1578116922645-3976907a7671", "1586525198428-225f6f12cff5"], colors: [["Game Royal", "#1f4fd8"]], flags: ["featured", "new"], line: "Royal blue meets lightweight Flyknit — a modern read of a 1985 classic." },
  { slug: "air-jordan-1-high-pollen", name: "Air Jordan 1 High 'Pollen'", brand: "Jordan", cat: "sneakers", g: "unisex", price: 16295, img: ["1597248881519-db089d3744a5"], detail: true, colors: [["Pollen", "#f2b705"]], flags: ["new"], line: "Pollen-yellow overlays pop against white leather and a black Swoosh." },
  { slug: "sb-dunk-high-pastel-grain", name: "SB Dunk High 'Pastel Grain'", brand: "Nike SB", cat: "sneakers", g: "unisex", price: 10795, img: ["1584735175315-9d5df23860e6"], detail: true, colors: [["Peach Cream", "#f2b8a0"]], line: "Padded high-top skate support in a peach, cream and ice-blue mix." },
  { slug: "stefan-janoski-max-white", name: "Stefan Janoski Max White", brand: "Nike SB", cat: "sneakers", g: "men", price: 7295, img: ["1460353581641-37baddab0fa2"], detail: true, colors: [["White", "#f2f2f2"]], line: "Breathable mesh and a cushioned Max unit — the skate slip-in you never take off." },
  { slug: "puma-court-classic-leather", name: "Court Classic Leather", brand: "Puma", cat: "sneakers", g: "unisex", price: 5999, was: 7499, img: ["1608231387042-66d1773070a5"], detail: true, colors: [["White", "#f7f7f7"]], flags: ["best"], line: "Clean court lines, soft leather and a perforated toe for all-day breathability." },
  { slug: "puma-rs-x-reinvention-rose", name: "RS-X Reinvention Rose", brand: "Puma", cat: "sneakers", g: "women", price: 8999, img: ["1608667508764-33cf0726b13a"], detail: true, colors: [["Rose", "#f4b6b8"]], flags: ["new"], line: "Chunky, bold and rose-toned — Running System tech reinvented for the street." },
  { slug: "new-balance-x90-blush", name: "X-90 Reconstructed Blush", brand: "New Balance", cat: "sneakers", g: "women", price: 9499, img: ["1551107696-a4b0c5a0d9a2"], detail: true, colors: [["Blush", "#f3a6b7"]], line: "Heritage 990 DNA remixed with a sculpted midsole and a blush suede upper." },
  { slug: "new-balance-247-olive", name: "247 Sport Olive", brand: "New Balance", cat: "sneakers", g: "men", price: 8799, was: 9999, img: ["1539185441755-769473a23570"], detail: true, colors: [["Olive", "#5c6b3a"]], line: "A sock-like fit with REVlite cushioning — the everyday trainer in military olive." },
  { slug: "new-balance-574-core-pastel", name: "574 Core Pastel", brand: "New Balance", cat: "sneakers", g: "women", price: 7999, img: ["1465453869711-7e174808ace9"], detail: true, colors: [["Lilac Peach", "#c8b6ff"]], flags: ["best"], line: "The most New Balance shoe ever, softened with lilac and peach pastels." },
  { slug: "vans-old-skool-burgundy", name: "Old Skool Burgundy", brand: "Vans", cat: "sneakers", g: "unisex", price: 5499, img: ["1525966222134-fcfa99b8ae77"], detail: true, colors: [["Burgundy", "#6d1a2b"]], flags: ["best"], video: 3525, line: "Canvas-and-suede skate icon with the Sidestripe and a grippy waffle sole." },
  { slug: "vans-sk8-low-forest", name: "Sk8-Low Forest Suede", brand: "Vans", cat: "sneakers", g: "men", price: 5999, img: ["1507464098880-e367bc5d2c08"], detail: true, colors: [["Forest", "#29523f"]], line: "Deep forest suede with gum accents — laid-back, low-profile, always right." },
  { slug: "converse-chuck-70-hi-split", name: "Chuck 70 Hi 'Split Colour'", brand: "Converse", cat: "sneakers", g: "unisex", price: 6499, img: ["1617606002806-94e279c22567", "1607522370275-f14206abe5d3"], colors: [["Red / Black", "#c1121f"]], flags: ["new", "featured"], video: 1368, line: "Premium 12oz canvas, vintage egret midsole and a split red-and-black upper." },
  { slug: "adidas-forum-low-royal", name: "Forum Low Royal", brand: "Adidas", cat: "sneakers", g: "men", price: 9999, img: ["1620794341491-76be6eeb6946"], detail: true, colors: [["Cloud / Royal", "#1d3fbb"]], line: "The '84 hoops classic with its X-strap, now a street essential." },
  { slug: "adidas-eqt-support-grey", name: "EQT Support Grey Knit", brand: "Adidas", cat: "sneakers", g: "men", price: 8499, was: 10999, img: ["1518002171953-a080ee817e1f"], detail: true, colors: [["Grey Two", "#9a9a9a"]], line: "Engineered knit, supportive cage and a boost of everyday bounce." },
  { slug: "metro-chunk-runner", name: "Metro Chunk Runner", brand: "Waquar Studio", cat: "sneakers", g: "unisex", price: 6999, img: ["1595341888016-a392ef81b7de", "1560769629-975ec94e6a86"], colors: [["Teal Tangerine", "#1e7f8c"], ["Stone", "#d8d2c4"]], flags: ["new", "featured"], line: "Our in-house chunky runner — stacked foam, layered mesh and a city-bred attitude." },
  { slug: "cloud-minimal-leather", name: "Cloud Minimal Leather", brand: "Waquar Studio", cat: "sneakers", g: "unisex", price: 4999, img: ["1603808033192-082d6919d3e1", "1622760807800-66cf1466fc08"], colors: [["Cloud", "#f3efe7"], ["Sand", "#c9b79c"]], flags: ["best"], line: "Italian-inspired minimalism: buttery leather, tonal stitching, zero noise." },
  { slug: "star-court-low", name: "Star Court Low", brand: "Waquar Studio", cat: "sneakers", g: "women", price: 3999, was: 4999, img: ["1587563871167-1ee9c731aefb"], detail: true, colors: [["White / Silver", "#ececec"]], line: "A tennis-inspired low-top with a metallic star on the heel tab." },
  { slug: "midnight-leather-low", name: "Midnight Leather Low", brand: "Waquar Studio", cat: "sneakers", g: "men", price: 5499, img: ["1604163546180-039a1781c0d2"], detail: true, colors: [["Midnight", "#1b1b1f"]], line: "Polished black leather, a sleek cupsole and just enough edge." },
  // Running
  { slug: "free-rn-flyknit-crimson", name: "Free RN Flyknit Crimson", brand: "Nike", cat: "running", g: "men", price: 9695, img: ["1542291026-7eec264c27ff"], detail: true, colors: [["Crimson", "#c1121f"]], flags: ["featured", "best"], video: 32812, line: "A sock-like Flyknit upper and flex-grooved sole that moves exactly like your foot." },
  { slug: "free-rn-5-olive", name: "Free RN 5.0 Olive", brand: "Nike", cat: "running", g: "men", price: 8495, img: ["1582588678413-dbf45f4823e9"], detail: true, colors: [["Olive Flak", "#556b2f"]], line: "Barefoot-inspired freedom with a lightweight knit and heel pull tab." },
  { slug: "phantom-glide-runner", name: "Phantom Glide Runner", brand: "Waquar Studio", cat: "running", g: "unisex", price: 6499, img: ["1491553895911-0055eca6402d"], detail: true, colors: [["Phantom Black", "#141414"]], video: 47879, line: "Responsive foam, a rocker geometry and a stealth upper for tempo days." },
  { slug: "aeroknit-grey", name: "AeroKnit Grey", brand: "Waquar Studio", cat: "running", g: "unisex", price: 5999, img: ["1562183241-b937e95585b6"], detail: true, colors: [["Heather Grey", "#8e8e8e"]], flags: ["new"], line: "Featherweight knit and a cloud-soft midsole that makes 10K feel like 5." },
  { slug: "prism-knit-runner", name: "Prism Knit Runner", brand: "Waquar Studio", cat: "running", g: "women", price: 7299, img: ["1604671801908-6f0c6a092c05"], detail: true, colors: [["Prism", "#6a5acd"]], flags: ["new", "featured"], video: 40765, line: "Iridescent knit that shifts from teal to violet with every stride." },
  { slug: "air-max-suede-mocha", name: "Air Max Suede Mocha", brand: "Nike", cat: "running", g: "men", price: 8995, was: 10495, img: ["1576672843344-f01907a9d40c"], detail: true, colors: [["Mocha", "#4a3b2a"]], line: "Retro running lines in rich mocha suede with a heel Air unit." },
  { slug: "hydro-trail-white", name: "Hydro Trail White", brand: "Waquar Studio", cat: "running", g: "unisex", price: 6799, img: ["1465479423260-c4afc24172c6"], detail: true, colors: [["White", "#f5f5f5"]], line: "Water-repellent mesh and a lugged outsole for rain-soaked monsoon miles." },
  // Basketball
  { slug: "air-jordan-12-retro-gym-red", name: "Air Jordan 12 Retro 'Gym Red'", brand: "Jordan", cat: "basketball", g: "men", price: 17995, img: ["1575537302964-96cd47c06b1b"], detail: true, colors: [["Gym Red", "#b3001b"]], flags: ["featured"], line: "Rising-sun stitching, full-length Zoom Air and a carbon shank. Pure hardwood heritage." },
  { slug: "kyrie-7-black-ice", name: "Kyrie 7 'Black Ice'", brand: "Nike", cat: "basketball", g: "men", price: 11995, was: 13995, img: ["1605348532760-6753d2c43329"], detail: true, colors: [["Black Ice", "#0d0d0d"]], video: 746, line: "Low-to-the-ground Air Zoom Turbo and a traction pattern tuned for shifty handles." },
  // Training
  { slug: "superrep-go-3-volt", name: "SuperRep Go 3 Volt", brand: "Nike", cat: "training", g: "men", price: 8295, img: ["1606107557195-0e29a4b5b4aa"], detail: true, colors: [["Volt", "#c8f000"]], flags: ["new", "featured"], line: "Soft foam, a flexible Flyknit upper and a wide base for circuit days." },
  { slug: "legend-essential-3-pink", name: "Legend Essential 3 Pink", brand: "Nike", cat: "training", g: "women", price: 5695, img: ["1605408499391-6368c628ef42"], detail: true, colors: [["Black / Pink", "#1a1a1a"]], line: "A flat, stable platform for lifts with rubber wraps for agility work." },
  { slug: "aerocharge-futsal-blue", name: "Aerocharge Futsal Blue", brand: "Hummel", cat: "training", g: "men", price: 6999, img: ["1609250291996-fdebe6020a8f"], detail: true, colors: [["Blue / Volt", "#1e3a8a"]], line: "Indoor court grip and a snug synthetic upper made for five-a-side." },
  // Boots
  { slug: "heritage-lace-up-boot", name: "Heritage Lace-Up Boot", brand: "Waquar Studio", cat: "boots", g: "men", price: 8999, img: ["1520639888713-7851133b1ed0"], detail: true, colors: [["Tobacco", "#8b5a2b"]], flags: ["best"], line: "Oil-tanned leather, Goodyear-style welt and speed hooks that lace in seconds." },
  { slug: "wingtip-brogue-boot-tan", name: "Wingtip Brogue Boot Tan", brand: "Waquar Studio", cat: "boots", g: "men", price: 11499, img: ["1638609348722-aa2a3a67db26"], detail: true, colors: [["Tan", "#a0612c"]], flags: ["featured"], line: "Country brogue detailing on a hand-burnished tan boot with a commando sole." },
  { slug: "trailworker-boot", name: "Trailworker Boot", brand: "Waquar Studio", cat: "boots", g: "men", price: 7499, was: 8999, img: ["1605812860427-4024433a70fd"], detail: true, colors: [["Wheat Nubuck", "#b88746"]], video: 2753, line: "Padded collar, waterproof nubuck and a lug sole for trails and job sites." },
  { slug: "nude-stiletto-bootie", name: "Nude Stiletto Bootie", brand: "Waquar Studio", cat: "boots", g: "women", price: 6999, img: ["1621996659490-3275b4d0d951"], detail: true, colors: [["Nude", "#e3c1a8"]], line: "A pointed-toe ankle bootie on a slim stiletto with a side zip." },
  // Formal
  { slug: "cognac-derby", name: "Cognac Derby", brand: "Waquar Studio", cat: "formal", g: "men", price: 6499, img: ["1449505278894-297fdb3edbc1", "1614252235316-8c857d38b5f4"], colors: [["Cognac", "#9a4a1c"]], flags: ["best"], line: "Hand-finished cognac leather with an open-lace derby build for all-day comfort." },
  { slug: "double-monk-walnut", name: "Double Monk Walnut", brand: "Waquar Studio", cat: "formal", g: "men", price: 7999, img: ["1533867617858-e7b97e060509"], detail: true, colors: [["Walnut", "#5d3a1a"]], line: "Twin buckles, a chiselled toe and walnut-burnished calf leather." },
  { slug: "teal-suede-brogue", name: "Teal Suede Brogue", brand: "Waquar Studio", cat: "formal", g: "men", price: 7499, img: ["1560343090-f0409e92791a"], detail: true, colors: [["Teal", "#2a8c82"]], flags: ["new"], line: "A statement brogue in teal suede — for grooms, guests and anyone who dares." },
  { slug: "horsebit-loafer-tan", name: "Horsebit Loafer Tan", brand: "Waquar Studio", cat: "formal", g: "men", price: 6999, img: ["1616406432452-07bc5938759d"], detail: true, colors: [["Tan", "#9c5b2e"]], video: 35811, line: "Slip-on elegance with polished gold hardware and a leather sole." },
  // Heels
  { slug: "botanica-floral-pump", name: "Botanica Floral Pump", brand: "Waquar Studio", cat: "heels", g: "women", price: 4999, img: ["1543163521-1bf539c55dd2"], detail: true, colors: [["Botanica", "#3b82c4"]], flags: ["featured"], line: "A jacquard floral print on a 100mm stiletto — garden party, sorted." },
  { slug: "navy-suede-pump", name: "Navy Suede Pump", brand: "Waquar Studio", cat: "heels", g: "women", price: 4499, img: ["1515347619252-60a4bf4fff4f"], detail: true, colors: [["Navy", "#1f2a44"]], line: "Classic almond-toe pump in velvety navy suede on an 85mm heel." },
  { slug: "noir-pointed-stiletto", name: "Noir Pointed Stiletto", brand: "Waquar Studio", cat: "heels", g: "women", price: 5299, img: ["1596703263926-eb0762ee17e4", "1554062614-6da4fa67725a"], colors: [["Noir", "#0b0b0b"]], flags: ["best"], video: 35987, line: "The little black dress of shoes: patent leather, pointed toe, 105mm." },
  { slug: "nude-classic-pump", name: "Nude Classic Pump", brand: "Waquar Studio", cat: "heels", g: "women", price: 4299, was: 5299, img: ["1535043934128-cf0b28d52f95"], detail: true, colors: [["Nude", "#e8cdb5"]], line: "Leg-lengthening nude leather with a cushioned footbed." },
  { slug: "scarlet-strappy-heel", name: "Scarlet Strappy Heel", brand: "Waquar Studio", cat: "heels", g: "women", price: 4799, img: ["1613987876445-fcb353cd8e27"], detail: true, colors: [["Scarlet", "#d00000"]], flags: ["new"], video: 15999, line: "Barely-there straps in lipstick red on a slim 95mm heel." },
  // Sandals & flats
  { slug: "cork-two-strap-sandal", name: "Cork Two-Strap Sandal", brand: "Waquar Studio", cat: "sandals-flats", g: "unisex", price: 3499, img: ["1603487742131-4160ec999306"], detail: true, colors: [["Stone", "#cfc6b8"]], flags: ["best"], line: "Contoured cork footbed and adjustable suede straps — summer on repeat." },
  { slug: "blush-quilted-flat", name: "Blush Quilted Flat", brand: "Waquar Studio", cat: "sandals-flats", g: "women", price: 3999, img: ["1604001307862-2d953b875079"], detail: true, colors: [["Blush", "#f1c9c1"]], line: "Quilted leather ballet flat with a cap toe and bendable sole." },
];

const HIGHLIGHTS: Record<CatSlug, string[]> = {
  sneakers: ["Premium leather & textile upper", "Cushioned midsole for all-day wear", "Rubber cupsole with pivot grip", "Padded collar & tongue"],
  running: ["Breathable engineered knit", "Responsive foam midsole", "Flex grooves for natural stride", "Reflective heel details"],
  basketball: ["Zoom Air cushioning", "Multi-directional traction", "Lockdown lacing system", "Supportive mid-foot shank"],
  training: ["Wide, stable base for lifts", "Flexible forefoot", "Durable rubber wraps", "Breathable mesh panels"],
  boots: ["Full-grain leather upper", "Water-resistant finish", "Cushioned removable insole", "Lug outsole for grip"],
  formal: ["Hand-burnished leather", "Leather lining", "Blake-stitched construction", "Leather & rubber sole"],
  heels: ["Padded insole", "Leather lining", "Non-slip sole", "Stable stiletto heel"],
  "sandals-flats": ["Contoured footbed", "Adjustable straps", "Lightweight sole", "Soft leather upper"],
};

const SIZE_RUNS: Record<G, string[]> = {
  men: ["6", "7", "8", "9", "10", "11"],
  women: ["3", "4", "5", "6", "7", "8"],
  unisex: ["4", "5", "6", "7", "8", "9", "10", "11"],
};

const FIRST = ["Aarav", "Vivaan", "Aditya", "Ishaan", "Kabir", "Rohan", "Arjun", "Ananya", "Diya", "Saanvi", "Meera", "Priya", "Zara", "Riya", "Nisha", "Imran", "Farhan", "Sana", "Kavya", "Neha", "Rahul", "Siddharth", "Tanvi", "Aisha"];
const LAST = ["Sharma", "Verma", "Singh", "Khan", "Iyer", "Patel", "Gupta", "Reddy", "Nair", "Das", "Kapoor", "Mehta", "Ansari", "Joshi", "Rao", "Sinha"];
const CITIES = [
  ["Gaya", "Bihar", "823001"],
  ["Patna", "Bihar", "800001"],
  ["Mumbai", "Maharashtra", "400050"],
  ["Bengaluru", "Karnataka", "560038"],
  ["New Delhi", "Delhi", "110017"],
  ["Kolkata", "West Bengal", "700019"],
  ["Hyderabad", "Telangana", "500034"],
  ["Pune", "Maharashtra", "411001"],
  ["Jaipur", "Rajasthan", "302001"],
  ["Chennai", "Tamil Nadu", "600017"],
  ["Lucknow", "Uttar Pradesh", "226001"],
];

const REVIEW_TITLES = ["Absolutely love them", "Worth every rupee", "Super comfortable", "Great fit", "Stunning in person", "My new daily pair", "Fast delivery, great quality", "Exceeded expectations", "Runs true to size", "Compliments everywhere"];
const REVIEW_BODIES = [
  "Wore them straight out of the box for a full day of walking and zero break-in needed. The cushioning is fantastic.",
  "The quality of the materials is much better than I expected. Packaging was premium too — felt like a proper unboxing.",
  "Ordered my usual size and the fit is spot on. Colour is exactly like the photos, maybe even better in daylight.",
  "Delivered in just two days. Checked authenticity, everything legit. Will definitely shop here again.",
  "These have become my go-to pair for college and weekends. Comfortable, stylish and easy to clean.",
  "I was unsure about ordering shoes online but the size guide was accurate and the exchange policy gave me confidence.",
  "Got so many compliments at a wedding. Comfortable enough to dance all night, which says a lot.",
  "Lightweight and breathable — perfect for Indian summers. The grip is great on wet roads too.",
  "Second pair I've bought from Waquar Footwear. Customer support helped me pick the right size over WhatsApp.",
  "Slightly snug for the first couple of days, then they moulded perfectly. Solid build quality.",
];

// ─── main ─────────────────────────────────────────────────────────────────
async function main() {
  const t0 = Date.now();
  console.log("→ Connecting to MongoDB…");
  await connectDB();
  console.log(`  connected to database "${mongoose.connection.db?.databaseName}"`);

  console.log("→ Clearing seeded collections…");
  await Promise.all([
    Product.deleteMany({}),
    Category.deleteMany({}),
    Review.deleteMany({}),
    Order.deleteMany({}),
    Banner.deleteMany({}),
    Coupon.deleteMany({}),
    Message.deleteMany({}),
    Subscriber.deleteMany({}),
    Setting.deleteMany({}),
    User.deleteMany({ role: "customer" }),
  ]);
  await Promise.all([Product, Category, Review, Order, Banner, Coupon, Message, Subscriber, Setting, User].map((m) => m.createIndexes()));

  // ── media ──
  console.log("→ Uploading media to Cloudinary (idempotent)…");
  type Job = { key: string; path: string; url: string; type: "image" | "video"; alt?: string };
  const jobs: Job[] = [];
  for (const c of CATEGORIES) jobs.push({ key: `cat:${c.slug}`, path: `categories/${c.slug}`, url: unsplash(c.image), type: "image", alt: c.name });
  for (const p of P) {
    p.img.forEach((id, i) => jobs.push({ key: `p:${p.slug}:${i}`, path: `products/${p.slug}-${i + 1}`, url: unsplash(id), type: "image", alt: p.name }));
    if (p.detail) jobs.push({ key: `p:${p.slug}:detail`, path: `products/${p.slug}-detail`, url: unsplashDetail(p.img[0]), type: "image", alt: `${p.name} detail` });
    if (p.video) jobs.push({ key: `p:${p.slug}:video`, path: `products/${p.slug}-video`, url: mixkit(p.video), type: "video" });
  }
  const bannerMedia = [
    { key: "hero:1", path: "banners/hero-city-footsteps", url: mixkit(4893), type: "video" as const },
    { key: "hero:2", path: "banners/hero-sunset-run", url: mixkit(4851), type: "video" as const },
    { key: "hero:3", path: "banners/hero-court", url: mixkit(744), type: "video" as const },
    { key: "hero:4", path: "banners/hero-heels", url: mixkit(49513), type: "video" as const },
    { key: "promo:1", path: "banners/promo-lace-up", url: mixkit(14766), type: "video" as const },
    { key: "promo:2", path: "banners/promo-flagship", url: unsplash("1441986300917-64674bd600d8"), type: "image" as const },
  ];
  jobs.push(...bannerMedia);

  const uploaded = await pool(jobs, 6, (j) => upload(j.path, j.url, j.type, j.alt));
  const media = new Map(jobs.map((j, i) => [j.key, uploaded[i]]));

  // ── settings, coupons ──
  await Setting.create({ key: "store" });
  const now = Date.now();
  const day = 86_400_000;
  await Coupon.insertMany([
    { code: "WELCOME10", description: "10% off your first order", type: "percent", value: 10, minOrder: 0 },
    { code: "SOLE500", description: "₹500 off orders above ₹4,999", type: "fixed", value: 500, minOrder: 4999 },
    { code: "MOTION20", description: "20% off orders above ₹9,999 — limited", type: "percent", value: 20, minOrder: 9999, maxUses: 100, usedCount: 37, expiresAt: new Date(now + 45 * day) },
    { code: "MONSOON15", description: "Monsoon sale (ended)", type: "percent", value: 15, minOrder: 2999, expiresAt: new Date(now - 10 * day), active: false },
  ]);

  // ── categories ──
  console.log("→ Creating categories & products…");
  const cats = await Category.insertMany(
    CATEGORIES.map((c, i) => ({
      name: c.name,
      slug: c.slug,
      tagline: c.tagline,
      description: `${c.tagline}. Discover our curated edit of ${c.name.toLowerCase()} from the world's best labels and our own Waquar Studio.`,
      image: media.get(`cat:${c.slug}`),
      order: i,
      featured: true,
    })),
  );
  const catId = new Map(cats.map((c) => [c.slug, c._id]));

  // ── products ──
  const productDocs = await Product.insertMany(
    P.map((p, idx) => {
      const images = p.img.map((_, i) => media.get(`p:${p.slug}:${i}`)!);
      if (p.detail) images.push(media.get(`p:${p.slug}:detail`)!);
      const sizes = SIZE_RUNS[p.g].map((size) => {
        const r = rand();
        return { size, stock: r < 0.1 ? 0 : r < 0.22 ? between(1, 3) : between(4, 24) };
      });
      return {
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        category: catId.get(p.cat),
        gender: p.g,
        description: `${p.line}\n\nEvery pair ships in original packaging with a Waquar Footwear authenticity card. Not the right fit? Exchanges and returns are free within 30 days.`,
        highlights: HIGHLIGHTS[p.cat],
        price: p.price,
        compareAtPrice: p.was ?? null,
        images,
        video: p.video ? media.get(`p:${p.slug}:video`) : null,
        colors: p.colors.map(([name, hex]) => ({ name, hex })),
        sizes,
        tags: [p.cat, p.brand.toLowerCase(), p.g, ...(p.flags ?? [])],
        featured: p.flags?.includes("featured") ?? false,
        isNewArrival: p.flags?.includes("new") ?? false,
        bestseller: p.flags?.includes("best") ?? false,
        active: true,
        soldCount: between(12, 140),
        createdAt: new Date(now - (P.length - idx) * day * (p.flags?.includes("new") ? 0.2 : 2)),
      };
    }),
  );

  // ── users ──
  console.log("→ Creating users…");
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@waquarfootwear.in").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) throw new Error("ADMIN_PASSWORD must be set in .env.local");
  await User.findOneAndUpdate(
    { email: adminEmail },
    { name: "Store Admin", email: adminEmail, role: "admin", passwordHash: await bcrypt.hash(adminPassword, 10) },
    { upsert: true },
  );
  const customerHash = await bcrypt.hash("Demo@12345", 10);
  const customers = await User.insertMany([
    { name: "Demo Customer", email: "demo@waquarfootwear.in", passwordHash: customerHash, role: "customer", phone: "+91 90000 00000", createdAt: new Date(now - 80 * day) },
    ...Array.from({ length: 22 }, (_, i) => {
      const name = `${FIRST[i % FIRST.length]} ${pick(LAST)}`;
      return {
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}${i}@example.com`,
        passwordHash: customerHash,
        role: "customer",
        phone: `+91 9${between(100000000, 999999999)}`,
        createdAt: new Date(now - between(1, 120) * day),
      };
    }),
  ]);

  // ── reviews ──
  console.log("→ Writing reviews…");
  const reviews: Record<string, unknown>[] = [];
  for (const p of productDocs) {
    const n = between(2, 7);
    for (let i = 0; i < n; i++) {
      const rating = rand() < 0.7 ? 5 : rand() < 0.8 ? 4 : 3;
      reviews.push({
        product: p._id,
        user: pick(customers)._id,
        name: `${pick(FIRST)} ${pick(LAST).charAt(0)}.`,
        rating,
        title: pick(REVIEW_TITLES),
        body: pick(REVIEW_BODIES),
        approved: rand() > 0.08,
        createdAt: new Date(now - between(1, 90) * day),
      });
    }
  }
  await Review.insertMany(reviews);
  const agg = await Review.aggregate<{ _id: unknown; avg: number; n: number }>([
    { $match: { approved: true } },
    { $group: { _id: "$product", avg: { $avg: "$rating" }, n: { $sum: 1 } } },
  ]);
  await Product.bulkWrite(
    agg.map((a) => ({
      updateOne: { filter: { _id: a._id }, update: { rating: Math.round(a.avg * 10) / 10, reviewCount: a.n } },
    })),
  );

  // ── orders (history for the dashboard) ──
  console.log("→ Generating order history…");
  const settings = { shippingFee: 149, freeShippingThreshold: 2999, taxRate: 12 };
  const orders: Record<string, unknown>[] = [];
  for (let i = 0; i < 96; i++) {
    const ageDays = Math.floor(Math.pow(rand(), 1.4) * 90);
    const createdAt = new Date(now - ageDays * day - between(0, 20) * 3_600_000);
    const cust = rand() < 0.85 ? pick(customers) : null;
    const [city, state, pincode] = pick(CITIES);
    const lineCount = rand() < 0.6 ? 1 : rand() < 0.7 ? 2 : 3;
    const items = Array.from({ length: lineCount }, () => {
      const p = pick(productDocs);
      return {
        product: p._id,
        name: p.name,
        slug: p.slug,
        image: p.images[0]?.url,
        size: pick(p.sizes).size,
        color: p.colors[0]?.name,
        price: p.price,
        qty: rand() < 0.85 ? 1 : 2,
      };
    });
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const discount = rand() < 0.2 ? Math.round(subtotal * 0.1) : 0;
    const totals = computeTotals(subtotal, discount, settings);
    const status =
      ageDays > 12
        ? rand() < 0.9
          ? "delivered"
          : "cancelled"
        : ageDays > 5
          ? pick(["shipped", "delivered", "delivered", "cancelled"])
          : ageDays > 1
            ? pick(["confirmed", "processing", "shipped"])
            : pick(["pending", "confirmed", "pending"]);
    const flow = ["pending", "confirmed", "processing", "shipped", "delivered"];
    const reached = status === "cancelled" ? ["pending", "cancelled"] : flow.slice(0, flow.indexOf(status) + 1);
    const paymentMethod = pick(["cod", "cod", "upi", "card"]);
    orders.push({
      orderNumber: `WF-${String(createdAt.getFullYear()).slice(2)}${String(createdAt.getMonth() + 1).padStart(2, "0")}${String(createdAt.getDate()).padStart(2, "0")}-${(0x100000 + i * 7919).toString(16).toUpperCase().slice(-6)}`,
      user: cust?._id ?? null,
      email: cust?.email ?? `guest${i}@example.com`,
      customer: { name: cust?.name ?? `${pick(FIRST)} ${pick(LAST)}`, phone: `+91 9${between(100000000, 999999999)}` },
      shippingAddress: { line1: `${between(1, 250)}, ${pick(["MG Road", "Station Road", "Park Street", "Linking Road", "Boring Road", "Indiranagar 2nd Stage"])}`, city, state, pincode, country: "India" },
      items,
      ...totals,
      couponCode: discount ? "WELCOME10" : null,
      paymentMethod,
      paymentStatus: status === "cancelled" ? (paymentMethod === "cod" ? "pending" : "refunded") : paymentMethod !== "cod" || status === "delivered" ? "paid" : "pending",
      status,
      timeline: reached.map((s, k) => ({ status: s, note: s === "pending" ? "Order placed" : undefined, at: new Date(createdAt.getTime() + k * day * 0.8) })),
      accessToken: `seed${i}`,
      createdAt,
      updatedAt: createdAt,
    });
  }
  await Order.insertMany(orders);

  // ── banners, messages, subscribers ──
  await Banner.insertMany([
    { placement: "hero", order: 0, eyebrow: "SS26 — The New Season Edit", title: "Move like the city never sleeps", subtitle: "New-season sneakers engineered for every step between sunrise and last metro.", ctaLabel: "Shop new arrivals", ctaHref: "/shop?tag=new", media: media.get("hero:1") },
    { placement: "hero", order: 1, eyebrow: "Run Club", title: "Every mile tells a story", subtitle: "Lightweight knits and responsive foams for tempo runs, long runs and everything between.", ctaLabel: "Shop running", ctaHref: "/shop?category=running", media: media.get("hero:2") },
    { placement: "hero", order: 2, eyebrow: "Court Ready", title: "Own the hardwood", subtitle: "Zoom-cushioned performance for players who live above the rim.", ctaLabel: "Shop basketball", ctaHref: "/shop?category=basketball", media: media.get("hero:3") },
    { placement: "hero", order: 3, eyebrow: "The Heels Edit", title: "Step into the spotlight", subtitle: "Stilettos, pumps and strappy sandals made for every entrance — and every exit.", ctaLabel: "Shop heels", ctaHref: "/shop?category=heels", media: media.get("hero:4") },
    { placement: "promo", order: 0, eyebrow: "Lace up. Break out.", title: "Built for the ones who keep moving", subtitle: "Up to 25% off selected running & training styles this week.", ctaLabel: "Shop the sale", ctaHref: "/shop?tag=sale", media: media.get("promo:1") },
    { placement: "promo", order: 1, eyebrow: "Visit our store", title: "Come try them on", subtitle: "Main Road, Kathokar Talab, Gaya. Walk in, try on, and find your fit.", ctaLabel: "Get directions", ctaHref: "/contact#map", media: media.get("promo:2") },
  ]);
  await Message.insertMany([
    { name: "Ritika Sinha", email: "ritika.s@example.com", subject: "Size exchange", message: "Hi! I ordered the Air Max 1 in UK 6 but need a UK 5. Can I exchange it at the Gaya store?", createdAt: new Date(now - 2 * day) },
    { name: "Mohd. Faizan", email: "faizan@example.com", subject: "Bulk order for our running club", message: "We are a 30-member running club in Gaya. Do you offer group discounts on the Phantom Glide Runner?", createdAt: new Date(now - 4 * day), read: true },
    { name: "Ankita Rao", email: "ankita.rao@example.com", subject: "Restock alert", message: "When will the Noir Pointed Stiletto be back in UK 4? Would love a notification.", createdAt: new Date(now - 6 * day) },
    { name: "Karan Mehta", email: "karan.m@example.com", subject: "Collaboration", message: "I run a sneaker content page (40K followers). Would love to discuss a collaboration for your SS26 drop.", createdAt: new Date(now - 9 * day), read: true },
  ]);
  await Subscriber.insertMany(
    Array.from({ length: 18 }, (_, i) => ({ email: `${pick(FIRST).toLowerCase()}.${i}@example.com`, createdAt: new Date(now - between(1, 60) * day) })),
  );

  // ── orphan purge (scoped to this project's assets only) ──
  console.log("→ Removing Cloudinary assets no longer referenced…");
  const usage = await getMediaUsage();
  const assets = await listProjectAssets();
  const orphans = assets.filter((a) => !usage.has(a.publicId));
  if (orphans.length) {
    const r = await destroyAssets(orphans);
    console.log(`  deleted ${r.deleted.length} orphaned asset(s)${r.failed.length ? `, ${r.failed.length} failed` : ""}`);
  } else {
    console.log("  none — Cloudinary and MongoDB are in sync");
  }

  console.log(
    `\n✓ Seeded ${cats.length} categories, ${productDocs.length} products, ${reviews.length} reviews, ${orders.length} orders, ${customers.length} customers, ${assets.length - orphans.length} media assets in ${((Date.now() - t0) / 1000).toFixed(1)}s`,
  );
  console.log(`  Admin login:    ${adminEmail}  (password from ADMIN_PASSWORD)`);
  console.log(`  Demo customer:  demo@waquarfootwear.in / Demo@12345`);
}

main()
  .then(() => mongoose.disconnect())
  .catch(async (err) => {
    console.error("\n✗ Seed failed:", err);
    await mongoose.disconnect();
    process.exit(1);
  });
