import { z } from "zod";
import { handle, json } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { signUpload, UPLOAD_AREAS } from "@/lib/cloudinary";

const input = z.object({ area: z.enum(UPLOAD_AREAS) });

/** Signs a direct browser → Cloudinary upload, scoped to this project's folder and tag. */
export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const { area } = input.parse(await req.json());
  return json(signUpload(area));
});
