import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    email: { type: String, required: true, lowercase: true, index: true },
    customer: { name: String, phone: String },
    shippingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: "India" },
    },
    items: [
      {
        _id: false,
        product: { type: Schema.Types.ObjectId, ref: "Product" },
        name: String,
        slug: String,
        image: String,
        size: String,
        color: String,
        price: Number,
        qty: Number,
      },
    ],
    subtotal: Number,
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: Number,
    couponCode: { type: String, default: null },
    paymentMethod: { type: String, enum: ["cod", "card", "upi"], default: "cod" },
    paymentStatus: { type: String, enum: ["pending", "paid", "refunded"], default: "pending" },
    status: { type: String, enum: ORDER_STATUSES, default: "pending", index: true },
    timeline: [{ _id: false, status: String, note: String, at: { type: Date, default: Date.now } }],
    accessToken: { type: String, select: false },
  },
  { timestamps: true },
);

export type OrderDoc = InferSchemaType<typeof OrderSchema>;
export const Order: Model<OrderDoc> = models.Order || model("Order", OrderSchema);
