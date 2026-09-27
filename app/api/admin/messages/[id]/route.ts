import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Message } from "@/lib/models";
import { ApiError, handle, json } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

type Ctx = RouteContext<"/api/admin/messages/[id]">;

async function id(ctx: Ctx) {
  const { id } = await ctx.params;
  if (!/^[a-f0-9]{24}$/i.test(id)) throw new ApiError(404, "Message not found");
  await connectDB();
  return id;
}

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  await requireAdmin();
  const { read } = z.object({ read: z.boolean() }).parse(await req.json());
  await Message.updateOne({ _id: await id(ctx) }, { read });
  return json({ ok: true });
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  await requireAdmin();
  await Message.deleteOne({ _id: await id(ctx) });
  return json({ ok: true });
});
