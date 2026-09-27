import { connectDB } from "@/lib/db";
import { Message } from "@/lib/models";
import { handle, json, rateLimit } from "@/lib/api";
import { contactInput } from "@/lib/validators";

export const POST = handle(async (req: Request) => {
  rateLimit(req, "contact", 5);
  const data = contactInput.parse(await req.json());
  await connectDB();
  await Message.create(data);
  return json({ ok: true }, 201);
});
