"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/context/cart-context";
import { formatPHP } from "@/lib/utils";
import type { Category, Product } from "@/types/product";
import { buildPromoHref } from "@/lib/slug";

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";
const PLACEHOLDER_IMAGE = "/products/placeholder.jpg";

// How many promo cards to tease on the homepage strip.
const MAX_HIGHLIGHTS = 8;

// Shared width for BOTH promo cards and best-seller cards, so switching
// tabs doesn't visually jump between two different card sizes.
const CARD_WIDTH = 210;
const CARD_WIDTH_SM = 240;

type PromoProduct = {
  id: string;
  name: string;
  brand: string;
  category: Category;
  price: number;
  originalPrice?: number | null;
  rating: number;
  reviews: number;
  tag?: string | null;
  inStock: boolean;
  stock: number;
  blurb: string;
  image: string;
  isPromo: boolean;
  promoStart: string | null;
  promoEnd: string | null;
};

type Tab = "promos" | "bestsellers";
type FetchStatus = "loading" | "ready" | "error";

function resolveImageUrl(path: string | null | undefined): string {
  if (!path || !path.trim()) return PLACEHOLDER_IMAGE;
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  return `${IMAGE_BASE_URL}${path}`;
}

// Only the "Bundle" tag is shown as a badge (case-insensitive).
function isBundle(tag: string | null | undefined): boolean {
  return !!tag && tag.trim().toLowerCase() === "bundle";
}

// "Bundle" and "N+ sold" chips. They sit in the card's text area (below the
// photo) instead of on top of it, because the product photos already contain
// logos and banner text that made the overlaid badges unreadable. The row
// keeps a minimum height so cards line up even when a card has no chips.
function CardBadges({
  bundle = false,
  sold,
}: {
  bundle?: boolean;
  sold?: number | null;
}) {
  const showSold = typeof sold === "number" && sold > 0;

  return (
    <div className="flex min-h-[1.5rem] flex-wrap items-center gap-1.5 font-sans">
      {bundle && (
        <span className="rounded-full bg-[#006B3F] px-2.5 py-1 text-xs font-bold uppercase leading-none tracking-wide text-white">
          Bundle
        </span>
      )}
      {showSold && (
        <span className="rounded-full bg-yellow-300 px-2.5 py-1 text-xs font-bold leading-none text-moss-950">
          {sold}+ sold
        </span>
      )}
    </div>
  );
}

// Shows the product image, and falls back to the default placeholder when
// there's no image path OR when the image fails to load (404, broken URL).
function ProductImage({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const [errored, setErrored] = React.useState(false);

  // Reset error state when the src changes
  React.useEffect(() => {
    setErrored(false);
  }, [src]);

  return (
    <Image
      src={errored ? PLACEHOLDER_IMAGE : resolveImageUrl(src)}
      alt={alt}
      fill
      sizes="260px"
      className={className}
      onError={() => setErrored(true)}
    />
  );
}

// Faded + "Sold Out" label layer shown on top of a sold-out product photo.
function SoldOutOverlay() {
  return (
    <span className="absolute inset-0 z-10 flex items-center justify-center bg-white/40">
      <span className="rounded-full bg-moss-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
        Sold Out
      </span>
    </span>
  );
}

// Shared "Add to Cart" button used by both card types. On mobile it is a
// round icon-only button; from the sm breakpoint up it fills the space next
// to the price and shows an "Add to cart" label. After a click the icon briefly
// turns into a bouncing check (and the label into "Added") so customers can
// see the item went into the cart.
function AddToCartButton({
  product,
  disabled,
}: {
  product: Product;
  disabled?: boolean;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    // Promo card is wrapped in a <Link>, so stop it from navigating.
    e.preventDefault();
    e.stopPropagation();

    addItem(product);
    toast.success(`${product.name} added to cart`);

    setAdded(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Button
      type="button"
      size="icon"
      disabled={disabled}
      aria-live="polite"
      aria-label={
        disabled ? `${product.name} is sold out` : `Add ${product.name} to cart`
      }
      title={disabled ? "Sold out" : "Add to cart"}
      onClick={handleClick}
      className={`h-9 w-9 shrink-0 rounded-full shadow-sm transition-all duration-200 active:scale-90 disabled:cursor-not-allowed disabled:bg-moss-200 disabled:text-moss-500 disabled:opacity-100 sm:w-auto sm:min-w-0 sm:flex-1 sm:gap-1.5 sm:px-3 sm:text-xs sm:font-semibold ${
        added
          ? "bg-green-700 hover:bg-green-700 max-sm:scale-110"
          : "max-sm:hover:scale-105"
      }`}
    >
      {added ? (
        <Check className="h-4 w-4 shrink-0 animate-bounce" />
      ) : (
        <ShoppingCart className="h-4 w-4 shrink-0" />
      )}
      {/* Label: hidden on mobile, visible on desktop */}
      <span className="hidden whitespace-nowrap sm:inline">
        {disabled ? "Sold out" : added ? "Added" : "Add to cart"}
      </span>
    </Button>
  );
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// A promo is "upcoming" if it has a start date that's still in the future.
function isUpcoming(product: PromoProduct): boolean {
  if (!product.promoStart) return false;
  const start = new Date(product.promoStart);
  start.setHours(0, 0, 0, 0);
  return start > startOfToday();
}

function PromoCard({
  product,
  highlighted = false,
}: {
  product: PromoProduct;
  // True briefly after the promo popup sends the customer to this card.
  highlighted?: boolean;
}) {
  const upcoming = isUpcoming(product);
  const soldOut = !product.inStock || product.stock <= 0;
  const [isSm, setIsSm] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    setIsSm(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsSm(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const width = isSm ? CARD_WIDTH_SM : CARD_WIDTH;

  const discountPct =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : null;

  return (
    <Link
      href={buildPromoHref(product)}
      className={`group flex flex-shrink-0 flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-green-300 ${
        highlighted
          ? "-translate-y-1 shadow-xl ring-4 ring-yellow-300"
          : "ring-moss-100"
      }`}
      style={{ width, maxWidth: width, minWidth: width }}
    >
      <div className="relative m-2.5 aspect-square overflow-hidden rounded-2xl bg-moss-50">
        <ProductImage
          src={product.image}
          alt={product.name}
          className={`object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
            soldOut ? "opacity-40 grayscale" : ""
          }`}
        />
        {soldOut && <SoldOutOverlay />}
        {discountPct !== null && !soldOut && (
          <span className="absolute left-2.5 top-2.5 z-20 rounded-full bg-yellow-300 px-2.5 py-1 text-[10px] font-bold text-moss-950 shadow-sm">
            -{discountPct}%
          </span>
        )}
        <span
          className={`absolute right-2.5 top-2.5 z-20 inline-flex h-6 w-6 items-center justify-center rounded-full text-white shadow-sm ${
            upcoming ? "bg-amber-500" : "bg-green-600"
          }`}
          title={upcoming ? "Coming soon" : "On promo"}
        >
          {upcoming ? (
            <CalendarClock className="h-3.5 w-3.5" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-1">
        <CardBadges bundle={isBundle(product.tag)} />
        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-moss-500">
          {product.brand}
        </p>
        <h3 className="line-clamp-2 min-h-[2.5rem] font-display text-sm font-medium leading-snug text-moss-900">
          {product.name}
        </h3>
        {/* One row: price on the left, button on the right
            (icon only on mobile, "Add to cart" label on desktop). */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div className="flex shrink-0 items-baseline gap-1.5 sm:flex-col-reverse sm:items-start sm:gap-0 sm:leading-tight">
            <span className="font-display text-lg font-semibold text-moss-900">
              {formatPHP(product.price)}
            </span>
            {product.originalPrice && (
              <span className="font-mono text-xs text-muted-foreground line-through">
                {formatPHP(product.originalPrice)}
              </span>
            )}
          </div>
          {/* PromoProduct and Product share the fields addItem relies on
              (id, name, price, image, etc.) but aren't the same type. */}
          <AddToCartButton
            product={product as unknown as Product}
            disabled={soldOut}
          />
        </div>
      </div>
    </Link>
  );
}

function BestSellerCard({ product }: { product: Product }) {
  const soldOut = !product.inStock || product.stock <= 0;

  return (
    <div className="group flex w-[210px] shrink-0 snap-start flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-moss-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-green-300 sm:w-[240px]">
      <div className="relative m-2.5 aspect-square overflow-hidden rounded-2xl bg-moss-50">
        <ProductImage
          src={product.image}
          alt={product.name}
          className={`object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
            soldOut ? "opacity-40 grayscale" : ""
          }`}
        />
        {soldOut && <SoldOutOverlay />}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-1">
        <CardBadges sold={product.totalOrders} />
        <h3 className="line-clamp-2 min-h-[2.5rem] font-display text-sm font-medium leading-snug text-moss-900">
          {product.name}
        </h3>

        {/* One row: price on the left, button on the right
            (icon only on mobile, "Add to cart" label on desktop). */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="shrink-0 font-display text-lg font-semibold text-moss-900">
            {formatPHP(product.price)}
          </span>
          <AddToCartButton product={product} disabled={soldOut} />
        </div>
      </div>
    </div>
  );
}

function CardsSkeleton({ width }: { width: number }) {
  return (
    <div className="flex gap-3 overflow-hidden sm:gap-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex-shrink-0" style={{ width }}>
          <Skeleton className="aspect-square rounded-2xl" />
          <Skeleton className="mt-2 h-2.5 w-2/3" />
          <Skeleton className="mt-1.5 h-2.5 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function FeaturedProducts() {
  const [tab, setTab] = React.useState<Tab>("promos");

  const [promos, setPromos] = React.useState<PromoProduct[]>([]);
  const [promosStatus, setPromosStatus] =
    React.useState<FetchStatus>("loading");

  const [bestSellers, setBestSellers] = React.useState<Product[]>([]);
  const [bestSellersStatus, setBestSellersStatus] =
    React.useState<FetchStatus>("loading");

  // Promo the popup asked us to jump to (waiting to be scrolled into view),
  // and the promo currently showing the highlight ring.
  const [focusId, setFocusId] = React.useState<string | null>(null);
  const [highlightId, setHighlightId] = React.useState<string | null>(null);

  const scrollerRef = React.useRef<HTMLDivElement>(null);

  // The promo popup fires this event when a promo (or "Shop the promos") is
  // clicked, so the strip is on the "Limited time" tab when the page scrolls
  // to it. If the event carries a productId, we also focus that card.
  React.useEffect(() => {
    const showPromos = (e: Event) => {
      setTab("promos");
      const id = (e as CustomEvent<{ productId?: string }>).detail?.productId;
      setFocusId(id ?? null);
    };
    window.addEventListener("show-promos-tab", showPromos);
    return () => window.removeEventListener("show-promos-tab", showPromos);
  }, []);

  // Fetch both lists once on mount (not just the active tab) so switching
  // tabs is instant with no re-fetch/loading flash.
  React.useEffect(() => {
    let cancelled = false;

    async function fetchPromos() {
      try {
        const res = await fetch("/api/products?promo=active", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load promo products");
        const data = await res.json();
        const list: PromoProduct[] = Array.isArray(data.products)
          ? data.products
          : [];
        if (!cancelled) {
          setPromos(list);
          setPromosStatus("ready");
        }
      } catch {
        if (!cancelled) setPromosStatus("error");
      }
    }

    async function fetchBestSellers() {
      try {
        const res = await fetch("/api/products/best-sellers?limit=8", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!cancelled) {
          setBestSellers(Array.isArray(data.products) ? data.products : []);
          setBestSellersStatus("ready");
        }
      } catch {
        if (!cancelled) setBestSellersStatus("error");
      }
    }

    fetchPromos();
    fetchBestSellers();
    return () => {
      cancelled = true;
    };
  }, []);

  // Live promos first, then upcoming ones. The promo the popup pointed at is
  // always included, even if it falls outside the first MAX_HIGHLIGHTS.
  const highlights = React.useMemo(() => {
    const sorted = [...promos].sort((a, b) => {
      const aUpcoming = isUpcoming(a);
      const bUpcoming = isUpcoming(b);
      if (aUpcoming !== bUpcoming) return aUpcoming ? 1 : -1;
      return 0;
    });
    const top = sorted.slice(0, MAX_HIGHLIGHTS);
    if (focusId && !top.some((p) => p.id === focusId)) {
      const target = sorted.find((p) => p.id === focusId);
      if (target) top.push(target);
    }
    return top;
  }, [promos, focusId]);

  const promosEmpty =
    promosStatus === "error" ||
    (promosStatus === "ready" && highlights.length === 0);
  const bestSellersEmpty =
    bestSellersStatus === "error" ||
    (bestSellersStatus === "ready" && bestSellers.length === 0);
  const bothSettled =
    promosStatus !== "loading" && bestSellersStatus !== "loading";

  // If the current (or default) tab turns out to be empty but the other one
  // has content, flip to whichever tab actually has something to show.
  React.useEffect(() => {
    if (!bothSettled) return;
    if (tab === "promos" && promosEmpty && !bestSellersEmpty)
      setTab("bestsellers");
    if (tab === "bestsellers" && bestSellersEmpty && !promosEmpty)
      setTab("promos");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bothSettled, promosEmpty, bestSellersEmpty]);

  // When the popup asks for a specific promo: center its card in the strip
  // and give it a highlight ring.
  React.useEffect(() => {
    if (!focusId || tab !== "promos" || promosStatus !== "ready") return;

    const t = setTimeout(() => {
      const el = document.getElementById(`promo-${focusId}`);
      // inline:"center" moves the horizontal scroller; block:"nearest" avoids
      // fighting the page's vertical scroll to the section.
      el?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
      setHighlightId(focusId);
      setFocusId(null);
    }, 450); // let the popup close + page scroll start first

    return () => clearTimeout(t);
  }, [focusId, tab, promosStatus, highlights]);

  // Clear the highlight ring after a moment.
  React.useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(null), 2500);
    return () => clearTimeout(t);
  }, [highlightId]);

  const scrollByAmount = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  // Fail silently on the homepage if BOTH lists are empty/failed — no
  // promos and no best sellers, no section.
  if (bothSettled && promosEmpty && bestSellersEmpty) return null;

  const isPromos = tab === "promos";
  const status = isPromos ? promosStatus : bestSellersStatus;
  const seeAllHref = isPromos ? "/promos" : "#shop";

  return (
    // Plain Quanta Green (#00A552) from the brand palette — no image,
    // no decorative elements. The id is the scroll target for the promo
    // popup's buttons; scroll-mt-20 leaves room for the sticky navbar.
    <section
      id="special-promos"
      className="relative w-full scroll-mt-20 overflow-hidden bg-[#00A552]"
    >
      <div className="container py-6 sm:py-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3 sm:mb-4">
          <div>
            <div className="inline-flex items-center gap-1 rounded-full border border-moss-200 bg-white/70 p-0.5 backdrop-blur">
              <button
                type="button"
                onClick={() => setTab("promos")}
                aria-pressed={isPromos}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors ${
                  isPromos
                    ? "bg-yellow-300 text-moss-950"
                    : "text-moss-600 hover:text-moss-900"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                Limited time
              </button>
              <button
                type="button"
                onClick={() => setTab("bestsellers")}
                aria-pressed={!isPromos}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors ${
                  !isPromos
                    ? "bg-green-600 text-white"
                    : "text-moss-600 hover:text-moss-900"
                }`}
              >
                Customer favorites
              </button>
            </div>
            <h2 className="mt-1.5 font-display text-xl font-medium text-white sm:text-2xl">
              {isPromos ? "Special Promos" : "Best sellers"}
            </h2>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <Link
              href={seeAllHref}
              className="group flex items-center gap-1 text-sm font-medium text-white hover:text-white/80"
            >
              {isPromos ? "See all" : "View all"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <div className="hidden items-center gap-1.5 sm:flex">
              <button
                type="button"
                onClick={() => scrollByAmount(-1)}
                aria-label="Scroll left"
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-white transition-colors hover:bg-white hover:text-green-600 focus-ring"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollByAmount(1)}
                aria-label="Scroll right"
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-white transition-colors hover:bg-white hover:text-green-600 focus-ring"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {status === "loading" ? (
          <CardsSkeleton width={CARD_WIDTH} />
        ) : (
          <div
            ref={scrollerRef}
            className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-5 sm:px-0"
          >
            {isPromos
              ? highlights.map((product) => (
                  <div
                    key={product.id}
                    id={`promo-${product.id}`}
                    className="snap-start"
                  >
                    <PromoCard
                      product={product}
                      highlighted={highlightId === product.id}
                    />
                  </div>
                ))
              : bestSellers.map((product) => (
                  <BestSellerCard key={product.id} product={product} />
                ))}
          </div>
        )}
      </div>
    </section>
  );
}
