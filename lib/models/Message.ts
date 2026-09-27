import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const MessageSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    subject: String,
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const SubscriberSchema = new Schema(
  { email: { type: String, required: true, unique: true, lowercase: true, trim: true } },
  { timestamps: true },
);

export type MessageDoc = InferSchemaType<typeof MessageSchema>;
export const Message: Model<MessageDoc> = models.Message || model("Message", MessageSchema);
export type SubscriberDoc = InferSchemaType<typeof SubscriberSchema>;
export const Subscriber: Model<SubscriberDoc> = models.Subscriber || model("Subscriber", SubscriberSchema);
