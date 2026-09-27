import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Banner } from "@/lib/models";
import { ApiError, handle, json } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { destroyIfUnreferenced, removedMedia } from "@/lib/media-refs";
import { bannerInput } from "@/lib/validators";
import type { Media } from "@/lib/types";

type Ctx = RouteContext<"/api/admin/banners/[id]">;

async function load(ctx: Ctx) {
  const { id } = await ctx.params;
  if (!/^[a-f0-9]{24}$/i.test(id)) throw new ApiError(404, "Banner not found");
  await connectDB();
  const banner = await Banner.findById(id).lean();
  if (!banner) throw new ApiError(404, "Banner not found");
  return banner;
}

export const PUT = handle(async (req: Request, ctx: Ctx) => {
  await requireAdmin();
  const old = await load(ctx);
  const data = bannerInput.parse(await req.json());
  await Banner.updateOne({ _id: old._id }, { ...data, media: data.media ?? null, poster: data.poster ?? null });
  const cleanup = await destroyIfUnreferenced(
    removedMedia([old.media as Media, old.poster as Media], [data.media as Media, data.poster as Media]),
  );
  return json({ ok: true, mediaDeleted: cleanup.deleted.length });
});

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  await requireAdmin();
  const old = await load(ctx);
  const data = z.object({ active: z.boolean().optional(), order: z.number().int().optional() }).parse(await req.json());
  await Banner.updateOne({ _id: old._id }, data);
  return json({ ok: true });
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  await requireAdmin();
  const banner = await load(ctx);
  await Banner.deleteOne({ _id: banner._id });
  const cleanup = await destroyIfUnreferenced([banner.media as Media, banner.poster as Media].filter(Boolean));
  return json({ ok: true, mediaDeleted: cleanup.deleted.length });
});
