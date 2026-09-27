import SettingsForm from "@/components/admin/SettingsForm";
import { PageHeader } from "@/components/admin/ui";
import { getSettings } from "@/lib/data";

export const metadata = { title: "Settings" };

export default async function SettingsAdmin() {
  const settings = await getSettings();
  return (
    <>
      <PageHeader title="Settings" subtitle="Store details, shipping rules and contact information." />
      <SettingsForm settings={settings} />
    </>
  );
}
