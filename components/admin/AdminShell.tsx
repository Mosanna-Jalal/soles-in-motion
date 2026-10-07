"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ExternalLink,
  FolderTree,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  Package,
  Presentation,
  Settings,
  ShoppingCart,
  TicketPercent,
  Users,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import Logo from "@/components/store/Logo";
import { ConfirmProvider } from "./ui";
import { api } from "@/lib/hooks";
import { cn } from "@/lib/utils";

type Badges = { pendingOrders: number; pendingReviews: number; unreadMessages: number };

const NAV = [
  { group: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  {
    group: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      { href: "/admin/banners", label: "Banners", icon: Presentation },
      { href: "/admin/media", label: "Media library", icon: Images },
    ],
  },
  {
    group: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart, badge: "pendingOrders" as const },
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
    ],
  },
  {
    group: "Engagement",
    items: [
      { href: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote, badge: "pendingReviews" as const },
      { href: "/admin/messages", label: "Inbox", icon: Inbox, badge: "unreadMessages" as const },
    ],
  },
  { group: "Store", items: [{ href: "/admin/settings", label: "Settings", icon: Settings }] },
];

function Nav({ badges, onNavigate }: { badges: Badges; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <nav className="flex flex-col gap-6">
      {NAV.map((g) => (
        <div key={g.group}>
          <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-mist/70">{g.group}</p>
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const active = isActive(item.href);
              const count = "badge" in item && item.badge ? badges[item.badge] : 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "text-ink" : "text-bone/70 hover:bg-ink-3 hover:text-bone",
                    )}
                  >
                    {active && <motion.span layoutId="admin-nav" className="absolute inset-0 rounded-xl bg-volt" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                    <item.icon className="relative h-[18px] w-[18px]" />
                    <span className="relative flex-1">{item.label}</span>
                    {count > 0 && (
                      <span className={cn("relative rounded-full px-2 py-0.5 font-mono text-[10px] font-bold", active ? "bg-ink text-volt" : "bg-ember text-ink")}>{count}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function AdminShell({ children, admin, badges }: { children: ReactNode; admin: { name: string; email: string }; badges: Badges }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" });
    toast("Signed out");
    router.push("/admin/login");
    router.refresh();
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="group mb-8 flex items-center gap-2 px-3">
        <Logo compact />
        <div>
          <p className="display text-lg leading-none">Waquar/Footwear</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-volt">Admin</p>
        </div>
      </Link>
      <div className="thin-scroll -mx-1 flex-1 overflow-y-auto px-1">
        <Nav badges={badges} onNavigate={() => setOpen(false)} />
      </div>
      <div className="mt-6 rounded-2xl border border-line p-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-volt font-bold text-ink">{admin.name.charAt(0)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{admin.name}</p>
            <p className="truncate text-xs text-mist">{admin.email}</p>
          </div>
          <button onClick={logout} className="rounded-lg p-2 text-mist hover:bg-ink-3 hover:text-ember" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ConfirmProvider>
      <div className="min-h-dvh bg-ink">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-ink-2 p-4 lg:block">{sidebar}</aside>

        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <motion.div className="absolute inset-0 bg-ink/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
              <motion.aside
                className="absolute inset-y-0 left-0 w-72 border-r border-line bg-ink-2 p-4"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <button onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-full p-2 hover:bg-bone/10" aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
                {sidebar}
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        <div className="lg:pl-64">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-ink/80 px-4 backdrop-blur-xl sm:px-8">
            <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-bone/10 lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <p className="hidden font-mono text-xs uppercase tracking-widest text-mist sm:block" suppressHydrationWarning>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <Link href="/" target="_blank" className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm hover:border-volt hover:text-volt">
              View store <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </header>
          <motion.main key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="px-4 py-8 sm:px-8">
            {children}
          </motion.main>
        </div>
      </div>
    </ConfirmProvider>
  );
}
