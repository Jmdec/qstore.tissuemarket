"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Download,
  PackageSearch,
  Store,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/context/cart-context";
import { CartSheet } from "@/components/cart-sheet";
import { AuthDialog } from "@/components/auth-dialog";
import { NavNotificationBell } from "@/components/nav-notification-bell";
import { TrackOrderDialog } from "@/components/track-order-dialog";
import { toast } from "sonner";

type CurrentUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  // Needed so the navbar can tell admins apart from regular customers —
  // used to redirect admins to the dashboard and hide customer-only links.
  role?: "admin" | "customer" | string;
};

// Not yet in lib.dom.d.ts — fired by Chromium browsers when the current
// page is eligible to be installed as a PWA.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function usePwaInstall() {
  const [installEvent, setInstallEvent] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") {
      toast.success("Quanta Paper installed");
    }
    setInstallEvent(null);
  };

  return {
    canInstall: !!installEvent && !isInstalled,
    promptInstall,
  };
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { count, clear } = useCart();
  const [cartOpen, setCartOpen] = React.useState(false);
  const [authOpen, setAuthOpen] = React.useState(false);
  const [authTab, setAuthTab] = React.useState<"login" | "register">("login");
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [trackOpen, setTrackOpen] = React.useState(false);
  const { canInstall, promptInstall } = usePwaInstall();

  const [user, setUser] = React.useState<CurrentUser | null>(null);
  const [userLoading, setUserLoading] = React.useState(true);

  const [searchQuery, setSearchQuery] = React.useState(
    () => searchParams.get("search") ?? "",
  );
  const [mobileSearchQuery, setMobileSearchQuery] = React.useState(
    () => searchParams.get("search") ?? "",
  );

  React.useEffect(() => {
    const current = searchParams.get("search") ?? "";
    setSearchQuery(current);
    setMobileSearchQuery(current);
  }, [searchParams]);

  const fetchCurrentUser = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });

      if (!res.ok) {
        setUser(null);
        return;
      }

      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setUserLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const isAdmin = user?.role === "admin";

  // If an admin account ends up on any customer-facing page (fresh login,
  // a bookmarked link, refresh, etc.), bounce them straight to the admin
  // dashboard instead of showing the storefront. This also covers /orders,
  // since order history is a customer-only view.
  React.useEffect(() => {
    if (userLoading) return;
    if (isAdmin && !pathname.startsWith("/admin")) {
      router.replace("/admin/orders");
    }
  }, [isAdmin, userLoading, pathname, router]);

  const openAuth = (tab: "login" | "register") => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) {
        toast.error("Could not log out. Please try again.");
        return;
      }
      setUser(null);
      clear();
      toast.success("Logged out successfully");
      router.refresh();
    } catch {
      toast.error("Could not reach the server. Please try again.");
    }
  };

  const runSearch = (query: string) => {
    const trimmed = query.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set("search", trimmed);
    const qs = params.toString();
    router.push(`/shop${qs ? `?${qs}` : ""}`);
    setMobileOpen(false);
  };

  const handleDesktopSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(searchQuery);
  };

  const handleMobileSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(mobileSearchQuery);
  };

  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()
    : null;

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="border-b border-moss-100 bg-background/95 backdrop-blur">
        {/* Row height + gap now scale up from mobile instead of being
            fixed at the desktop size — this was the main overflow source. */}
        <div className="container flex h-[72px] items-center gap-2 sm:h-24 sm:gap-4">
          <button
            className="shrink-0 rounded-full p-2 hover:bg-moss-50 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          <Link href="/" className="group flex shrink-0 items-center">
            {/* Q-Store logo is wide (not square), so we fix the height and let
      the width scale automatically to keep the aspect ratio. */}
            <Image
              src="/q-store-logo-no-bg.png"
              alt="Q-Store"
              width={400}
              height={100}
              priority
              className="h-10 w-auto object-contain transition-transform duration-300 ease-out group-hover:scale-105 sm:h-12 lg:h-14"
            />
          </Link>

          <form
            onSubmit={handleDesktopSearchSubmit}
            className="relative hidden flex-1 max-w-md md:block"
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-moss-400 transition-colors peer-focus:text-moss-600" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tissue, wipes, soap..."
              className="peer pl-10 transition-shadow focus-visible:ring-2 focus-visible:ring-moss-400 focus-visible:ring-offset-0"
            />
          </form>

          {/* Tighter gap on mobile between the icon cluster */}
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {/* Shop link */}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden items-center gap-1.5 rounded-full border-moss-300 text-moss-700 hover:bg-moss-50 sm:flex"
            >
              <Link href="/shop">
                <ShoppingCart  className="h-4 w-4" />
                Shop
              </Link>
            </Button>

            {canInstall && (
              <Button
                variant="outline"
                size="sm"
                className="hidden items-center gap-1.5 rounded-full border-moss-300 text-moss-700 hover:bg-moss-50 sm:flex"
                onClick={promptInstall}
              >
                <Download className="h-4 w-4" />
                Install app
              </Button>
            )}

            {/* Reseller sign-up — customer-facing only; admins get redirected
                away from this layout before it would ever render for them. */}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden items-center gap-1.5 rounded-full border-moss-300 text-moss-700 hover:bg-moss-50 sm:flex"
            >
              <Link href="/reseller">
                <Store className="h-4 w-4" />
                Become a reseller
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="hidden items-center gap-1.5 rounded-full border-moss-300 text-moss-700 hover:bg-moss-50 sm:flex"
              onClick={() => setTrackOpen(true)}
            >
              <PackageSearch className="h-4 w-4" />
              Track order
            </Button>

            {/* Push notification bell — always visible, next to account/cart */}
            <NavNotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* Smaller tap target on mobile, full size at sm+ */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full [&_svg]:h-5 [&_svg]:w-5 sm:h-12 sm:w-12 sm:[&_svg]:h-7 sm:[&_svg]:w-7"
                  aria-label="Account"
                >
                  {!userLoading && initials ? (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-moss-700 text-[11px] font-bold text-white sm:h-8 sm:w-8 sm:text-xs">
                      {initials}
                    </span>
                  ) : (
                    <User />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {user ? (
                  <>
                    <DropdownMenuLabel className="max-w-[200px] truncate">
                      {user.first_name} {user.last_name}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* Order history is customer-only — admins are
                        redirected to /admin anyway, so don't offer this. */}
                    {!isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/orders">Orders</Link>
                      </DropdownMenuItem>
                    )}
                    {!isAdmin && (
                      <DropdownMenuItem asChild className="sm:hidden">
                        <Link href="/reseller">Become a reseller</Link>
                      </DropdownMenuItem>
                    )}
                    {canInstall && (
                      <DropdownMenuItem
                        onSelect={promptInstall}
                        className="sm:hidden"
                      >
                        Install app
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleLogout}>
                      Log out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuLabel>My account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => openAuth("login")}>
                      Log in
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => openAuth("register")}>
                      Register
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="sm:hidden">
                      <Link href="/reseller">Become a reseller</Link>
                    </DropdownMenuItem>
                    {canInstall && (
                      <DropdownMenuItem
                        onSelect={promptInstall}
                        className="sm:hidden"
                      >
                        Install app
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Same mobile/desktop size split as the account button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-full [&_svg]:h-5 [&_svg]:w-5 sm:h-12 sm:w-12 sm:[&_svg]:h-7 sm:[&_svg]:w-7"
              aria-label="Open cart"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart  />
              {count > 0 && (
                <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-moss-700 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="container flex flex-col gap-1 pb-4 lg:hidden">
            <form
              onSubmit={handleMobileSearchSubmit}
              className="relative mb-2 mt-1"
            >
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-moss-400" />
              <Input
                value={mobileSearchQuery}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="pl-10"
              />
            </form>

            {/* Shop link */}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="mb-1 flex items-center justify-center gap-1.5 rounded-full border-moss-300 text-moss-700"
              onClick={() => setMobileOpen(false)}
            >
              <Link href="/shop">
                <LayoutGrid className="h-4 w-4" />
                Shop
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="mb-1 flex items-center justify-center gap-1.5 rounded-full border-moss-300 text-moss-700"
              onClick={() => {
                setTrackOpen(true);
                setMobileOpen(false);
              }}
            >
              <PackageSearch className="h-4 w-4" />
              Track order
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="mb-1 flex items-center justify-center gap-1.5 rounded-full border-moss-300 text-moss-700"
              onClick={() => setMobileOpen(false)}
            >
              <Link href="/reseller">
                <Store className="h-4 w-4" />
                Become a reseller
              </Link>
            </Button>
            {canInstall && (
              <Button
                variant="outline"
                size="sm"
                className="mb-1 flex items-center justify-center gap-1.5 rounded-full border-moss-300 text-moss-700"
                onClick={promptInstall}
              >
                <Download className="h-4 w-4" />
                Install app
              </Button>
            )}
          </nav>
        )}
      </div>

      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        defaultTab={authTab}
        onAuthSuccess={fetchCurrentUser}
      />
      <TrackOrderDialog open={trackOpen} onOpenChange={setTrackOpen} />
    </header>
  );
}
