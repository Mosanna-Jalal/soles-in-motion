import { connectDB } from "@/lib/db";
import { Setting } from "@/lib/models";
import { handle, json } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { settingsInput } from "@/lib/validators";

export const PUT = handle(async (req: Request) => {
  await requireAdmin();
  const data = settingsInput.parse(await req.json());
  await connectDB();
  await Setting.updateOne({ key: "store" }, { ...data, key: "store" }, { upsert: true });
  return json({ ok: true });
});
