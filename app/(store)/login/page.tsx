import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/store/AuthForm";
import AuthShell from "@/components/store/AuthShell";
import { getSession } from "@/lib/auth";
import { getCategories } from "@/lib/data";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  if (await getSession()) redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/account");
  const cats = await getCategories();
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to track orders, save addresses and check out faster." image={cats.find((c) => c.slug === "running")?.image?.url}>
      <AuthForm mode="login" next={next} />
    </AuthShell>
  );
}
