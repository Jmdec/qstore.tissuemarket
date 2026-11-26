"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PackageSearch,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { formatPHP } from "@/lib/utils";
import { AuthDialog } from "@/components/auth-dialog";
import { useCart } from "@/context/cart-context";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

type OrderItem = {
  id: number;
  product_id: string;
  name: string;
  price: number | string;
  qty: number;
  image: string | null;
  brand: string | null;
};

type Order = {
  id: number;
  tracking_number: string | null;
  email: string;
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  zip: string;
  phone: string;
  payment_method: "gcash" | "maya" | "bank" | "qr" | "cod";
  proof_path: string | null;
  subtotal: number | string;
  total: number | string;
  status: OrderStatus;
  items: OrderItem[];
  created_at: string;
  // Free-text location noted by admin when the order was marked "shipped"
  // (e.g. courier hub, last scan location). May be null.
  shipping_location: string | null;
};

type CurrentUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  // Order history is customer-only. If an admin account somehow lands
  // here directly (typed URL, old bookmark, etc.), we redirect them away
  // below rather than showing them their own (nonexistent) order history.
  role?: "admin" | "customer" | string;
};

const PAYMENT_LABELS: Record<Order["payment_method"], string> = {
  gcash: "GCash",
  maya: "Maya",
  bank: "Bank transfer",
  qr: "Scan QR",
  cod: "Cash on delivery",
};

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

const TRACK_STEPS: {
  key: OrderStatus;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "pending", label: "Pending", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: PackageCheck },
];

function stepIndex(status: OrderStatus) {
  const normalized = status === "processing" ? "confirmed" : status;
  const idx = TRACK_STEPS.findIndex((s) => s.key === normalized);
  return idx === -1 ? 0 : idx;
}

function OrderTracker({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 sm:px-4 sm:py-3">
        <XCircle className="h-4 w-4 shrink-0 text-destructive" />
        <p className="text-xs font-medium text-destructive sm:text-sm">
          This order was cancelled.
        </p>
      </div>
    );
  }

  const current = stepIndex(status);

  return (
    <div className="flex items-center">
      {TRACK_STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i < current;
        const active = i === current;
        const reached = done || active;

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1 sm:gap-1.5">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors sm:h-8 sm:w-8 ${
                  reached
                    ? "border-[#006B3F] bg-[#006B3F] text-white"
                    : "border-[#C6C8C5] bg-white text-[#252927]/40"
                }`}
              >
                <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
              </span>
              <span
                className={`hidden text-center text-[10px] font-medium leading-tight sm:block sm:text-[11px] ${
                  reached ? "text-[#252927]" : "text-[#252927]/40"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < TRACK_STEPS.length - 1 && (
              <div
                className={`mx-1 mb-3 h-0.5 min-w-[12px] flex-1 rounded-full transition-colors sm:mx-2 sm:mb-4 ${
                  i < current ? "bg-[#006B3F]" : "bg-[#C6C8C5]"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  // Palette-only badge colors. Cancelled keeps the destructive color on
  // purpose so it still reads as an error state.
  const styles: Record<OrderStatus, string> = {
    pending: "bg-[#C6C8C5]/30 text-[#252927] border-[#C6C8C5]",
    confirmed: "bg-[#006B3F]/10 text-[#006B3F] border-[#006B3F]/30",
    processing: "bg-[#006B3F]/10 text-[#006B3F] border-[#006B3F]/30",
    shipped: "bg-[#00A552]/10 text-[#006B3F] border-[#00A552]/40",
    delivered: "bg-[#006B3F] text-white border-[#006B3F]",
    cancelled: "bg-destructive/5 text-destructive border-destructive/30",
  };

  const labels: Record<OrderStatus, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [reordered, setReordered] = React.useState(false);
  const { addItem } = useCart();

  const date = new Date(order.created_at).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const copyTracking = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!order.tracking_number) return;
    try {
      await navigator.clipboard.writeText(order.tracking_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available — silently ignore.
    }
  };

  // Re-add every item from this order to the cart at its original
  // price/qty. Doesn't touch stock/availability — the cart/checkout
  // flow is responsible for catching anything that's no longer sellable.
  const buyAgain = (e: React.MouseEvent) => {
    e.stopPropagation();
    order.items.forEach((item) => {
      addItem(
        {
          id: item.product_id,
          name: item.name,
          price: Number(item.price),
          image: item.image ?? "",
          brand: item.brand ?? "",
        },
        item.qty,
      );
    });
    setReordered(true);
    setTimeout(() => setReordered(false), 1500);
  };

  // Only surface the location while it's still "in transit" — once
  // delivered or cancelled, the last hub isn't useful info anymore.
  const showShippingLocation =
    !!order.shipping_location &&
    order.status !== "delivered" &&
    order.status !== "cancelled";

  return (
    <div className="rounded-2xl border border-[#C6C8C5] bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-col gap-2 p-4 text-left sm:flex-row sm:items-center sm:justify-between sm:p-5"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-base font-semibold italic text-[#252927]">
              Order #{order.id}
            </p>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-0.5 truncate font-mono text-xs text-[#252927]/50">
            {date} · {order.items.length}{" "}
            {order.items.length === 1 ? "item" : "items"} ·{" "}
            {PAYMENT_LABELS[order.payment_method]}
          </p>
          {order.tracking_number && (
            <p className="mt-1 truncate font-mono text-[11px] text-[#252927]/60">
              Tracking:{" "}
              <span className="font-semibold text-[#252927]">
                {order.tracking_number}
              </span>
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
          <span className="font-mono text-sm font-semibold text-[#252927]">
            {formatPHP(Number(order.total))}
          </span>
          <button
            type="button"
            onClick={buyAgain}
            className="shrink-0 rounded-full border border-[#C6C8C5] px-3 py-1.5 font-mono text-[11px] font-medium text-[#006B3F] transition-colors hover:border-[#006B3F] focus-ring"
          >
            {reordered ? "Added!" : "Buy again"}
          </button>
          <ChevronDown
            className={`h-4 w-4 text-[#252927]/50 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-[#C6C8C5] p-4 sm:p-5">
          {order.tracking_number && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-dashed border-[#C6C8C5] bg-[#F8F7F4] px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-widest2 text-moss-500">
                  Tracking number
                </p>
                <p className="truncate font-mono text-sm font-semibold text-[#252927]">
                  {order.tracking_number}
                </p>
              </div>
              <button
                type="button"
                onClick={copyTracking}
                className="shrink-0 rounded-full border border-[#C6C8C5] bg-white px-3 py-1.5 font-mono text-[11px] font-medium text-[#006B3F] transition-colors hover:border-[#006B3F] focus-ring"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <div className="min-w-[280px]">
              <OrderTracker status={order.status} />
            </div>
          </div>

          {/* Current shipping location, if the admin noted one */}
          {showShippingLocation && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#C6C8C5] bg-[#F8F7F4] px-3 py-2.5">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-[#006B3F]" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-widest2 text-[#006B3F]">
                  Current location
                </p>
                <p className="text-xs text-[#252927]">
                  {order.shipping_location}
                </p>
              </div>
            </div>
          )}

          <div className="mt-5 space-y-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between font-mono text-xs text-[#252927]/80"
              >
                <span className="min-w-0 flex-1 truncate pr-2">
                  {item.qty}× {item.name}
                </span>
                <span className="shrink-0 text-[#252927]">
                  {formatPHP(Number(item.price) * item.qty)}
                </span>
              </div>
            ))}
          </div>

          <div className="my-4 border-t border-dashed border-[#C6C8C5]" />

          <div className="space-y-1 font-mono text-xs">
            <div className="flex justify-between text-[#252927]/70">
              <span>Subtotal</span>
              <span>{formatPHP(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between pt-1 text-sm font-semibold text-[#252927]">
              <span>Total</span>
              <span>{formatPHP(Number(order.total))}</span>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[#C6C8C5] bg-[#F8F7F4] p-3">
            <p className="text-xs font-semibold text-[#252927]">Shipping to</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {order.first_name} {order.last_name} · {order.address},{" "}
              {order.city} {order.zip}
            </p>
            <p className="text-xs text-muted-foreground">{order.phone}</p>
          </div>

          {order.status === "pending" && order.proof_path && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              We&apos;ve received your proof of payment and are verifying it.
              This can take up to 1 business hour.
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={buyAgain}
              className="bg-white font-mono text-xs"
            >
              {reordered ? "Added to cart!" : "Buy this order again"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(
    null,
  );
  const [userLoading, setUserLoading] = React.useState(true);
  const [authOpen, setAuthOpen] = React.useState(false);
  const [authTab, setAuthTab] = React.useState<"login" | "register">("login");

  const [orders, setOrders] = React.useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [ordersError, setOrdersError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [lastPage, setLastPage] = React.useState(1);

  const fetchCurrentUser = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        setCurrentUser(null);
        return;
      }
      const data = await res.json();
      setCurrentUser(data.user ?? null);
    } catch {
      setCurrentUser(null);
    } finally {
      setUserLoading(false);
    }
  }, []);

  const fetchOrders = React.useCallback(
    async (targetPage: number, append: boolean, status: string) => {
      if (append) setLoadingMore(true);
      else setOrdersLoading(true);
      setOrdersError(null);

      try {
        const params = new URLSearchParams({ page: String(targetPage) });
        if (status !== "all") params.set("status", status);

        const res = await fetch(`/api/orders?${params.toString()}`, {
          cache: "no-store",
        });

        if (res.status === 401) {
          setOrders([]);
          return;
        }
        if (!res.ok) throw new Error("Failed to load orders");

        const data = await res.json();
        setOrders((prev) =>
          append ? [...prev, ...(data.orders ?? [])] : (data.orders ?? []),
        );
        setPage(data.meta?.current_page ?? 1);
        setLastPage(data.meta?.last_page ?? 1);
      } catch {
        setOrdersError("We couldn't load your orders. Please try again.");
      } finally {
        setOrdersLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Order history is customer-only. Admin accounts get redirected to the
  // admin dashboard instead of seeing this page.
  React.useEffect(() => {
    if (userLoading) return;
    if (currentUser?.role === "admin") {
      router.replace("/admin/orders");
    }
  }, [currentUser, userLoading, router]);

  React.useEffect(() => {
    if (userLoading) return;
    if (!currentUser || currentUser.role === "admin") {
      setOrdersLoading(false);
      setOrders([]);
      return;
    }
    fetchOrders(1, false, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, userLoading, filter]);

  const openAuth = (tab: "login" | "register") => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  const handleAuthSuccess = () => {
    fetchCurrentUser();
  };

  // While we're figuring out who's logged in, or while an admin is being
  // redirected away, just show the loading state rather than flashing
  // customer content.
  const loading =
    userLoading ||
    (!!currentUser && currentUser.role === "admin") ||
    (!!currentUser && ordersLoading);

  return (
    <>
      {/* Paper White (#F8F7F4) page background from the brand palette */}
      <div aria-hidden className="fixed inset-0 -z-10 bg-[#F8F7F4]" />

      <Navbar />
      <main className="container relative max-w-3xl flex-1 py-6 sm:py-8">
        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-2xl font-medium italic text-[#252927] sm:text-3xl">
            My orders
          </h1>
          {currentUser && currentUser.role !== "admin" && !ordersLoading && (
            <button
              type="button"
              onClick={() => fetchOrders(1, false, filter)}
              className="inline-flex items-center gap-1.5 rounded text-xs font-medium text-[#006B3F] hover:text-[#00A552] focus-ring"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          )}
        </div>
        {/* Small Quanta Green accent under the title */}
        <div className="mt-3 h-1 w-12 rounded-full bg-[#00A552]" />

        {currentUser && currentUser.role !== "admin" && (
          <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`shrink-0 rounded-full border px-3 py-1.5 font-mono text-xs font-medium transition-colors focus-ring ${
                  filter === f.key
                    ? "border-[#006B3F] bg-[#006B3F] text-white"
                    : "border-[#C6C8C5] bg-white text-[#252927]/70 hover:border-[#006B3F]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="mt-8 flex flex-col items-center gap-3 py-16 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C6C8C5] border-t-[#006B3F]" />
            <p className="text-sm text-muted-foreground">
              Loading your orders...
            </p>
          </div>
        ) : !currentUser ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#C6C8C5] bg-white py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F8F7F4]">
              <PackageSearch className="h-7 w-7 text-[#006B3F]" />
            </div>
            <h2 className="font-display text-xl font-medium text-[#252927]">
              Log in to see your orders
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Your order history and tracking status will appear here once
              you&apos;re logged in.
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                variant="outline"
                className="bg-white"
                onClick={() => openAuth("register")}
              >
                Register
              </Button>
              <Button variant="gradient" onClick={() => openAuth("login")}>
                Log in
              </Button>
            </div>
          </div>
        ) : ordersError ? (
          <div className="mt-8 flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-destructive">{ordersError}</p>
            <Button
              variant="outline"
              className="bg-white"
              onClick={() => fetchOrders(1, false, filter)}
            >
              Try again
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#C6C8C5] bg-white py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F8F7F4]">
              <PackageSearch className="h-7 w-7 text-[#006B3F]" />
            </div>
            <h2 className="font-display text-xl font-medium text-[#252927]">
              {filter === "all" ? "No orders yet" : `No ${filter} orders`}
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {filter === "all"
                ? "Place your first order to see it appear here."
                : "Try a different filter, or check back later."}
            </p>
            {filter === "all" && (
              <Button asChild variant="gradient" className="mt-2">
                <Link href="/#shop">Start shopping</Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-col gap-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>

            {page < lastPage && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  className="bg-white"
                  onClick={() => fetchOrders(page + 1, true, filter)}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Load more orders"}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        defaultTab={authTab}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}
