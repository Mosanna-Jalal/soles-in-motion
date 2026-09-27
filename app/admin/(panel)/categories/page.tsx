import CategoryManager from "@/components/admin/CategoryManager";
import { PageHeader } from "@/components/admin/ui";
import { getCategories } from "@/lib/data";

export const metadata = { title: "Categories" };

export default async function CategoriesAdmin() {
  const categories = await getCategories();
  return (
    <>
      <PageHeader title="Categories" subtitle="Collections shown in the navigation, shop filters and home page bento." />
      <CategoryManager categories={categories} />
    </>
  );
}
