import { ApiError, handle, json } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { listProjectAssets } from "@/lib/cloudinary";
import { destroyIfUnreferenced, getMediaUsage } from "@/lib/media-refs";
import { assetRefInput } from "@/lib/validators";

/** Every project asset in Cloudinary, annotated with where (if anywhere) it is used. */
export const GET = handle(async () => {
  await requireAdmin();
  const [assets, usage] = await Promise.all([listProjectAssets(), getMediaUsage()]);
  return json({
    assets: assets.map((a) => ({ ...a, usage: usage.get(a.publicId) ?? null })),
  });
});

/** Deletes a single asset — refused if any document still references it. */
export const DELETE = handle(async (req: Request) => {
  await requireAdmin();
  const ref = assetRefInput.parse(await req.json());
  const r = await destroyIfUnreferenced([ref]);
  if (r.skipped.length) throw new ApiError(409, "This file is still in use — remove it from its product, category or banner first.");
  if (r.failed.length) throw new ApiError(502, "Cloudinary could not delete the file. Please try again.");
  return json({ ok: true });
});
