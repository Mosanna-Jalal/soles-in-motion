import { z } from "zod";
import { isOwnedPublicId } from "./cloudinary";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id");
const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  trimmed(max)
    .optional()
    .transform((v) => v || undefined);

export const mediaSchema = z
  .object({
    url: z.url(),
    publicId: z.string().min(1),
    resourceType: z.enum(["image", "video"]).default("image"),
    width: z.number().optional(),
    height: z.number().optional(),
    format: z.string().optional(),
    bytes: z.number().optional(),
    alt: z.string().max(200).optional(),
  })
  .refine((m) => isOwnedPublicId(m.publicId), "Media must be uploaded through the admin panel");

const imageMedia = mediaSchema.refine((m) => m.resourceType === "image", "Expected an image");
const videoMedia = mediaSchema.refine((m) => m.resourceType === "video", "Expected a video");

export const productInput = z.object({
  name: trimmed(120).min(2, "Name is too short"),
  slug: optionalText(140),
  brand: trimmed(60).min(1, "Brand is required"),
  category: objectId,
  gender: z.enum(["men", "women", "unisex", "kids"]),
  description: trimmed(5000).default(""),
  highlights: z.array(trimmed(200).min(1)).max(12).default([]),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).nullable().optional(),
  images: z.array(imageMedia).max(12).default([]),
  video: videoMedia.nullable().optional(),
  colors: z
    .array(
      z.object({
        name: trimmed(40).min(1),
        hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colour must be a hex value"),
      }),
    )
    .max(12)
    .default([]),
  sizes: z
    .array(z.object({ size: trimmed(10).min(1), stock: z.coerce.number().int().min(0) }))
    .max(30)
    .default([]),
  tags: z.array(trimmed(30).toLowerCase().min(1)).max(20).default([]),
  featured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  bestseller: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const categoryInput = z.object({
  name: trimmed(60).min(2),
  slug: optionalText(80),
  tagline: optionalText(120),
  description: optionalText(1000),
  image: imageMedia.nullable().optional(),
  order: z.coerce.number().int().default(0),
  featured: z.boolean().default(true),
});

export const bannerInput = z.object({
  eyebrow: optionalText(60),
  title: trimmed(120).min(2),
  subtitle: optionalText(300),
  ctaLabel: optionalText(40),
  ctaHref: optionalText(200),
  media: mediaSchema.nullable().optional(),
  poster: imageMedia.nullable().optional(),
  placement: z.enum(["hero", "promo"]),
  order: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});

export const couponInput = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{3,20}$/, "Code must be 3–20 letters, numbers, - or _"),
  description: optionalText(200),
  type: z.enum(["percent", "fixed"]),
  value: z.coerce.number().min(0),
  minOrder: z.coerce.number().min(0).default(0),
  maxUses: z.coerce.number().int().min(0).default(0),
  expiresAt: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v ? new Date(v) : null)),
  active: z.boolean().default(true),
});

export const settingsInput = z.object({
  storeName: trimmed(60).min(2),
  tagline: trimmed(120),
  announcement: trimmed(200),
  shippingFee: z.coerce.number().min(0),
  freeShippingThreshold: z.coerce.number().min(0),
  taxRate: z.coerce.number().min(0).max(50),
  contactEmail: z.email(),
  contactPhone: trimmed(30),
  address: trimmed(200),
  hours: trimmed(80),
  mapLat: z.coerce.number().min(-90).max(90),
  mapLng: z.coerce.number().min(-180).max(180),
  instagram: optionalText(200),
  youtube: optionalText(200),
  x: optionalText(200),
});

export const registerInput = z.object({
  name: trimmed(80).min(2, "Please enter your name"),
  email: z.email("Enter a valid email").transform((v) => v.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export const loginInput = z.object({
  email: z.email("Enter a valid email").transform((v) => v.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export const orderInput = z.object({
  email: z.email("Enter a valid email").transform((v) => v.toLowerCase()),
  customer: z.object({
    name: trimmed(80).min(2, "Enter your full name"),
    phone: z
      .string()
      .trim()
      .regex(/^[+0-9 ()-]{10,16}$/, "Enter a valid phone number"),
  }),
  shippingAddress: z.object({
    line1: trimmed(160).min(4, "Enter your street address"),
    line2: optionalText(160),
    city: trimmed(60).min(2, "Enter your city"),
    state: trimmed(60).min(2, "Enter your state"),
    pincode: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "PIN code must be 6 digits"),
    country: trimmed(60).default("India"),
  }),
  items: z
    .array(
      z.object({
        productId: objectId,
        size: trimmed(10).min(1),
        color: optionalText(40),
        qty: z.coerce.number().int().min(1).max(10),
      }),
    )
    .min(1, "Your bag is empty")
    .max(30),
  couponCode: optionalText(20),
  paymentMethod: z.enum(["cod", "card", "upi"]),
});

export const orderUpdateInput = z.object({
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]).optional(),
  paymentStatus: z.enum(["pending", "paid", "refunded"]).optional(),
  note: optionalText(300),
});

export const reviewInput = z.object({
  productId: objectId,
  name: trimmed(60).min(2, "Please enter your name"),
  rating: z.coerce.number().int().min(1).max(5),
  title: optionalText(100),
  body: trimmed(2000).min(10, "Tell us a bit more (10+ characters)"),
});

export const contactInput = z.object({
  name: trimmed(80).min(2, "Please enter your name"),
  email: z.email("Enter a valid email"),
  subject: optionalText(120),
  message: trimmed(3000).min(10, "Message is too short"),
});

export const newsletterInput = z.object({
  email: z.email("Enter a valid email").transform((v) => v.toLowerCase()),
});

export const assetRefInput = z.object({
  publicId: z.string().refine(isOwnedPublicId, "Not a project asset"),
  resourceType: z.enum(["image", "video"]).default("image"),
});
