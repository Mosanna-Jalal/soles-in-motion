import { Schema } from "mongoose";

/** Cloudinary asset reference. Every stored asset is owned by exactly one document field. */
export const MediaSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, enum: ["image", "video"], default: "image" },
    width: Number,
    height: Number,
    format: String,
    bytes: Number,
    alt: String,
  },
  { _id: false },
);
