import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { MediaSchema } from "./media";

const BannerSchema = new Schema(
  {
    eyebrow: String,
    title: { type: String, required: true },
    subtitle: String,
    ctaLabel: String,
    ctaHref: String,
    media: { type: MediaSchema, default: null },
    poster: { type: MediaSchema, default: null },
    placement: { type: String, enum: ["hero", "promo"], default: "hero", index: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type BannerDoc = InferSchemaType<typeof BannerSchema>;
export const Banner: Model<BannerDoc> = models.Banner || model("Banner", BannerSchema);
