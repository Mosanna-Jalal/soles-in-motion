import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/auth";
import { getAdminBadges } from "@/lib/admin-data";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · Waquar Footwear" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdminPage();
  const badges = await getAdminBadges();
  return (
    <AdminShell admin={{ name: admin.name, email: admin.email }} badges={badges}>
      {children}
    </AdminShell>
  );
}
