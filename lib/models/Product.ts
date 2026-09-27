import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { MediaSchema } from "./media";

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    brand: { type: String, required: true, trim: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    gender: { type: String, enum: ["men", "women", "unisex", "kids"], default: "unisex", index: true },
    description: { type: String, default: "" },
    highlights: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, default: null },
    images: { type: [MediaSchema], default: [] },
    video: { type: MediaSchema, default: null },
    colors: { type: [{ name: String, hex: String, _id: false }], default: [] },
    sizes: { type: [{ size: String, stock: { type: Number, default: 0, min: 0 }, _id: false }], default: [] },
    tags: { type: [String], default: [] },
    featured: { type: Boolean, default: false, index: true },
    isNewArrival: { type: Boolean, default: false },
    bestseller: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

ProductSchema.index({ name: "text", brand: "text", tags: "text", description: "text" });

export type ProductDoc = InferSchemaType<typeof ProductSchema>;
export const Product: Model<ProductDoc> = models.Product || model("Product", ProductSchema);
