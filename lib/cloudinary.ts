import { v2 as cloudinary } from "cloudinary";
import type { Media, ResourceType } from "./types";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

/**
 * The Cloudinary account is shared with other projects, so every asset this app
 * creates lives under CLD_ROOT/ and carries CLD_TAG. Nothing outside that scope is
 * ever listed or deleted.
 */
export const CLD_ROOT = process.env.CLOUDINARY_FOLDER || "soles-in-motion";
export const CLD_TAG = CLD_ROOT;
export const UPLOAD_AREAS = ["products", "categories", "banners", "misc"] as const;
export type UploadArea = (typeof UPLOAD_AREAS)[number];

export type AssetRef = Pick<Media, "publicId" | "resourceType">;

export function isOwnedPublicId(publicId: unknown): publicId is string {
  return typeof publicId === "string" && publicId.startsWith(`${CLD_ROOT}/`);
}

export function isOwnedUrl(url: unknown): boolean {
  return (
    typeof url === "string" &&
    url.startsWith(`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`) &&
    url.includes(`/${CLD_ROOT}/`)
  );
}

export function signUpload(area: UploadArea) {
  const timestamp = Math.round(Date.now() / 1000);
  const params = { folder: `${CLD_ROOT}/${area}`, tags: CLD_TAG, timestamp };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);
  return {
    ...params,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
  };
}

function dedupe(assets: AssetRef[]) {
  const seen = new Map<string, AssetRef>();
  for (const a of assets) {
    if (a && isOwnedPublicId(a.publicId)) seen.set(a.publicId, { publicId: a.publicId, resourceType: a.resourceType || "image" });
  }
  return [...seen.values()];
}

/**
 * Permanently deletes assets from Cloudinary (and invalidates CDN copies).
 * Small batches use the Upload API (not rate limited); large purges use the Admin API.
 */
export async function destroyAssets(assets: AssetRef[]) {
  const list = dedupe(assets);
  const deleted: string[] = [];
  const failed: string[] = [];

  for (const type of ["image", "video"] as ResourceType[]) {
    const ids = list.filter((a) => a.resourceType === type).map((a) => a.publicId);
    if (!ids.length) continue;

    if (ids.length <= 10) {
      await Promise.all(
        ids.map(async (id) => {
          try {
            const r = await cloudinary.uploader.destroy(id, { resource_type: type, invalidate: true });
            (r.result === "ok" || r.result === "not found" ? deleted : failed).push(id);
          } catch (err) {
            console.error("[cloudinary] destroy failed", id, err);
            failed.push(id);
          }
        }),
      );
      continue;
    }

    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      try {
        const r = await cloudinary.api.delete_resources(chunk, { resource_type: type, invalidate: true });
        for (const [id, status] of Object.entries(r.deleted as Record<string, string>)) {
          (status === "deleted" || status === "not_found" ? deleted : failed).push(id);
        }
      } catch (err) {
        console.error("[cloudinary] bulk delete failed", err);
        failed.push(...chunk);
      }
    }
  }
  return { deleted, failed };
}

export interface CloudAsset {
  publicId: string;
  resourceType: ResourceType;
  url: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  createdAt: string;
}

/** Lists every asset owned by this project (tag + folder scoped). */
export async function listProjectAssets(): Promise<CloudAsset[]> {
  const out: CloudAsset[] = [];
  for (const type of ["image", "video"] as ResourceType[]) {
    let cursor: string | undefined;
    do {
      const res = await cloudinary.api.resources_by_tag(CLD_TAG, {
        resource_type: type,
        max_results: 500,
        next_cursor: cursor,
      });
      for (const r of res.resources) {
        if (!isOwnedPublicId(r.public_id)) continue;
        out.push({
          publicId: r.public_id,
          resourceType: type,
          url: r.secure_url,
          format: r.format,
          bytes: r.bytes,
          width: r.width,
          height: r.height,
          createdAt: r.created_at,
        });
      }
      cursor = res.next_cursor;
    } while (cursor);
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
