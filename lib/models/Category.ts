import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { MediaSchema } from "./media";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    tagline: String,
    description: String,
    image: { type: MediaSchema, default: null },
    order: { type: Number, default: 0 },
    featured: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type CategoryDoc = InferSchemaType<typeof CategorySchema>;
export const Category: Model<CategoryDoc> = models.Category || model("Category", CategorySchema);
