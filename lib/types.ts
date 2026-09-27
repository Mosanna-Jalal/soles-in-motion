export type ResourceType = "image" | "video";

export interface Media {
  url: string;
  publicId: string;
  resourceType: ResourceType;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  alt?: string;
}

export interface CategoryT {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  tagline?: string;
  image?: Media | null;
  order: number;
  featured: boolean;
  productCount?: number;
}

export interface SizeStock {
  size: string;
  stock: number;
}

export interface ColorT {
  name: string;
  hex: string;
}

export type Gender = "men" | "women" | "unisex" | "kids";

export interface ProductT {
  _id: string;
  name: string;
  slug: string;
  brand: string;
  category: CategoryT | string;
  gender: Gender;
  description: string;
  highlights: string[];
  price: number;
  compareAtPrice?: number | null;
  images: Media[];
  video?: Media | null;
  colors: ColorT[];
  sizes: SizeStock[];
  tags: string[];
  featured: boolean;
  isNewArrival: boolean;
  bestseller: boolean;
  active: boolean;
  rating: number;
  reviewCount: number;
  soldCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewT {
  _id: string;
  product: string | { _id: string; name: string; slug: string };
  name: string;
  rating: number;
  title?: string;
  body: string;
  approved: boolean;
  createdAt: string;
}

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentMethod = "cod" | "card" | "upi";

export interface OrderItemT {
  product: string;
  name: string;
  slug: string;
  image?: string;
  size: string;
  color?: string;
  price: number;
  qty: number;
}

export interface AddressT {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface OrderT {
  _id: string;
  orderNumber: string;
  user?: string | null;
  email: string;
  customer: { name: string; phone: string };
  shippingAddress: AddressT;
  items: OrderItemT[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode?: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: "pending" | "paid" | "refunded";
  status: OrderStatus;
  timeline: { status: OrderStatus; note?: string; at: string }[];
  createdAt: string;
}

export interface BannerT {
  _id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  media?: Media | null;
  poster?: Media | null;
  placement: "hero" | "promo";
  order: number;
  active: boolean;
}

export interface CouponT {
  _id: string;
  code: string;
  description?: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: string | null;
  active: boolean;
}

export interface SettingsT {
  storeName: string;
  tagline: string;
  announcement: string;
  shippingFee: number;
  freeShippingThreshold: number;
  taxRate: number;
  contactEmail: string;
  contactPhone: string;
  address: string;
  instagram?: string;
  youtube?: string;
  x?: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
}
