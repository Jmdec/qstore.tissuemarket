"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bell,
  Package,
  Handshake,
  Images,
  Tag,
  ShoppingCart,
  Users,
  Settings,
  Leaf,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

type CurrentUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  {
    label: "In App Notification",
    href: "/admin/announcement-notification",
    icon: Bell,
  },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Hero Banner", href: "/admin/hero-banner", icon: Images },
  { label: "Institutional", href: "/admin/institutional", icon: Package },
  { label: "Shop Categories", href: "/admin/categories-page", icon: Tag },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  { label: "Customers", href: "/admin/customers", icon: Users },
  {
    label: "Resellers",
    href: "/admin/reseller",
    icon: Handshake,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Fetch the logged-in user once on mount.
  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          setUser(data?.user ?? null);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoadingUser(false);
      }
    }

    fetchUser();
    return () => {
      cancelled = true;
    };
  }, []);

  // Close the drawer automatically whenever the route changes (i.e. after
  // tapping a nav link on mobile).
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close on Escape, and lock body scroll while the drawer is open.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore — we redirect regardless
    } finally {
      // Hard navigation — bypasses Next's client router cache entirely,
      // guaranteeing the browser re-requests /login and middleware re-runs
      // on any subsequent /admin visit.
      window.location.href = "/login";
    }
  }

  const displayName = user
    ? `${user.first_name} ${user.last_name}`.trim()
    : null;

  return (
    // `md:contents` makes this wrapper disappear at md+ so the <aside> below
    // becomes a direct flex item next to <main> (the original layout).
    // Below md it's a normal block, so the sticky mobile header stacks
    // correctly above <main> in the page's flex-col mobile layout.
    <div className="md:contents">
      {/* Mobile top bar — hamburger trigger, hidden on md+ */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-moss-100 bg-white px-4 md:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-moss-700 hover:bg-moss-50 hover:text-moss-900"
          aria-label="Open menu"
          aria-expanded={isOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-600 text-white">
            <Leaf className="h-4 w-4" />
          </div>
          <p className="font-display text-sm font-semibold text-moss-900">
            Quanta Admin
          </p>
        </div>
      </header>

      {/* Backdrop — mobile only, shown while drawer is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-moss-950/40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — fixed off-canvas drawer on mobile, static column on md+ */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-72 shrink-0 transform flex-col border-r border-moss-100 bg-white shadow-xl transition-transform duration-300 ease-in-out md:shadow-none",
          "md:sticky md:top-0 md:z-auto md:h-screen md:w-60 md:translate-x-0 md:self-start",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-moss-100 px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white">
              <Leaf className="h-4.5 w-4.5" />
            </div>
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold text-moss-900">
                Quanta Admin
              </p>
              <p className="text-[11px] text-muted-foreground">Store console</p>
            </div>
          </div>

          {/* Close button — mobile only */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-moss-500 hover:bg-moss-50 hover:text-moss-900 md:hidden"
            aria-label="Close menu"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname?.startsWith(item.href);

            const Icon = item.icon;

            if (item.disabled) {
              return (
                <div
                  key={item.href}
                  className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground/50"
                  title="Coming soon"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  <span className="ml-auto rounded-full bg-moss-100 px-1.5 py-0.5 text-[10px] font-medium text-moss-500">
                    Soon
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-moss-700 hover:bg-moss-50 hover:text-moss-900",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-moss-100 px-5 py-4">
          {isLoadingUser ? (
            <p className="text-[11px] text-muted-foreground">Loading…</p>
          ) : user ? (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[11px] text-muted-foreground">
                  Signed in as
                </p>
                <p className="truncate text-xs font-medium text-moss-800">
                  {displayName}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-moss-500 hover:bg-moss-50 hover:text-moss-900"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">Not signed in.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
