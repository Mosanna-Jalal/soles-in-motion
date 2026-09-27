import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Subscriber } from "@/lib/models";
import { handle, json } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

/** CSV export of the mailing list. */
export const GET = handle(async () => {
  await requireAdmin();
  await connectDB();
  const rows = await Subscriber.find().sort({ createdAt: -1 }).lean();
  const csv = ["email,subscribed_at", ...rows.map((r) => `${r.email},${new Date(r.createdAt as Date).toISOString()}`)].join("\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="subscribers.csv"` },
  });
});

export const DELETE = handle(async (req: Request) => {
  await requireAdmin();
  const { id } = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/i) }).parse(await req.json());
  await connectDB();
  await Subscriber.deleteOne({ _id: id });
  return json({ ok: true });
});
