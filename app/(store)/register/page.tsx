import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/store/AuthForm";
import AuthShell from "@/components/store/AuthShell";
import { getSession } from "@/lib/auth";
import { getCategories } from "@/lib/data";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage(props: PageProps<"/register">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  if (await getSession()) redirect("/account");
  const cats = await getCategories();
  return (
    <AuthShell title="Join Waquar" subtitle="Members get early drops, faster checkout and 10% off their first pair with WELCOME10." image={cats.find((c) => c.slug === "sneakers")?.image?.url}>
      <AuthForm mode="register" next={next} />
    </AuthShell>
  );
}
