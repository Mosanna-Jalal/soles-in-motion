import MediaLibrary from "@/components/admin/MediaLibrary";
import { PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Media library" };

export default function MediaAdmin() {
  return (
    <>
      <PageHeader title="Media library" subtitle="Every image and video this store has on Cloudinary, cross-checked against the database." />
      <MediaLibrary />
    </>
  );
}
