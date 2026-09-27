import { connectDB } from "@/lib/db";
import { Banner } from "@/lib/models";
import { handle, json } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { bannerInput } from "@/lib/validators";

export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const data = bannerInput.parse(await req.json());
  await connectDB();
  const banner = await Banner.create({ ...data, media: data.media ?? null, poster: data.poster ?? null });
  return json({ id: String(banner._id) }, 201);
});
