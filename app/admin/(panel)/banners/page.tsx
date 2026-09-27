import BannerManager from "@/components/admin/BannerManager";
import { PageHeader } from "@/components/admin/ui";
import { connectDB, serialize } from "@/lib/db";
import { Banner } from "@/lib/models";
import type { BannerT } from "@/lib/types";

export const metadata = { title: "Banners" };

export default async function BannersAdmin() {
  await connectDB();
  const banners = await Banner.find().sort({ placement: 1, order: 1 }).lean();
  return (
    <>
      <PageHeader title="Banners" subtitle="Hero slides and promotional blocks on the home page. Media is stored on Cloudinary." />
      <BannerManager banners={serialize<BannerT[]>(banners)} />
    </>
  );
}
