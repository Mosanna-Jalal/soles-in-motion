import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const SettingSchema = new Schema(
  {
    key: { type: String, default: "store", unique: true },
    storeName: { type: String, default: "Waquar Footwear" },
    tagline: { type: String, default: "Engineered to move." },
    announcement: { type: String, default: "Free shipping on orders over ₹2,999 · Easy 30-day returns" },
    shippingFee: { type: Number, default: 149 },
    freeShippingThreshold: { type: Number, default: 2999 },
    taxRate: { type: Number, default: 12 },
    contactEmail: { type: String, default: "hello@waquarfootwear.in" },
    contactPhone: { type: String, default: "+91 98765 43210" },
    address: { type: String, default: "Main Road, Kathokar Talab, Gaya, Bihar 823001" },
    hours: { type: String, default: "Open daily · 11am – 9pm" },
    // Store pin for the map (Kathokar Talab, Gaya). Adjustable from Admin → Settings.
    mapLat: { type: Number, default: 24.79773 },
    mapLng: { type: Number, default: 85.00462 },
    instagram: String,
    youtube: String,
    x: String,
  },
  { timestamps: true },
);

export type SettingDoc = InferSchemaType<typeof SettingSchema>;
export const Setting: Model<SettingDoc> = models.Setting || model("Setting", SettingSchema);
