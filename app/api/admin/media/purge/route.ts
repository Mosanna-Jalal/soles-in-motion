import { z } from "zod";
import { handle, json } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { destroyAssets, isOwnedPublicId, listProjectAssets } from "@/lib/cloudinary";
import { getMediaUsage } from "@/lib/media-refs";

const input = z.object({ publicIds: z.array(z.string().refine(isOwnedPublicId)).max(500).optional() });

const GRACE_MS = 60 * 60 * 1000;

/**
 * Deletes orphaned assets (all of them, or just the selected ones). In-use media is never touched.
 * A bulk purge skips files uploaded in the last hour — they may belong to a form that is still open.
 */
export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const { publicIds } = input.parse(await req.json().catch(() => ({})));
  const [assets, usage] = await Promise.all([listProjectAssets(), getMediaUsage()]);
  const wanted = publicIds ? new Set(publicIds) : null;
  const cutoff = Date.now() - GRACE_MS;
  const orphans = assets.filter(
    (a) => !usage.has(a.publicId) && (wanted ? wanted.has(a.publicId) : new Date(a.createdAt).getTime() < cutoff),
  );
  const r = await destroyAssets(orphans);
  const skippedRecent = wanted ? 0 : assets.filter((a) => !usage.has(a.publicId) && new Date(a.createdAt).getTime() >= cutoff).length;
  return json({ deleted: r.deleted.length, failed: r.failed.length, skippedRecent });
});
