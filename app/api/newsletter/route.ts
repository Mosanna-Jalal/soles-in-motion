import { connectDB } from "@/lib/db";
import { Subscriber } from "@/lib/models";
import { handle, json, rateLimit } from "@/lib/api";
import { newsletterInput } from "@/lib/validators";

export const POST = handle(async (req: Request) => {
  rateLimit(req, "newsletter", 5);
  const { email } = newsletterInput.parse(await req.json());
  await connectDB();
  await Subscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
  return json({ ok: true });
});
