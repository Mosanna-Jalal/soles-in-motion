import { z } from "zod";
import { handle, json } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { destroyIfUnreferenced } from "@/lib/media-refs";
import { assetRefInput } from "@/lib/validators";

const input = z.object({ assets: z.array(assetRefInput).max(50) });

/**
 * Called (often via navigator.sendBeacon) when an admin form is abandoned, to remove
 * uploads that were never saved. Anything a document references is left alone.
 */
export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const text = await req.text();
  const { assets } = input.parse(JSON.parse(text || "{}"));
  const r = await destroyIfUnreferenced(assets);
  return json(r);
});
