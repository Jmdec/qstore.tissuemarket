"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  PackageSearch,
  Clock,
  CalendarClock,
  ShoppingCart,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { formatPHP } from "@/lib/utils";
import type { Category, Product } from "@/types/product";
import { useCart } from "@/context/cart-context";
import { buildPromoHref } from "@/lib/slug";

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

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

function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return "/products/placeholder.jpg";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  return `${IMAGE_BASE_URL}${path}`;
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

// A promo is "active" if it already started (today or earlier) AND hasn't
// ended yet (end date is today or later, or has no end date at all).
function isActiveNow(product: PromoProduct): boolean {
  if (isUpcoming(product)) return false;
  if (product.promoEnd) {
    const end = new Date(product.promoEnd);
    end.setHours(23, 59, 59, 999);
    if (end.getTime() < startOfToday().getTime()) return false;
  }
  return true;
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - startOfToday().getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function PromoCard({ product }: { product: PromoProduct }) {
  const { addItem } = useCart();
  const upcoming = isUpcoming(product);
  const active = isActiveNow(product);
  const canAddToCart = active && product.inStock;
  const daysToStart = upcoming ? daysUntil(product.promoStart) : null;
  const daysToEnd = daysUntil(product.promoEnd);

  const discountPct =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : null;

  const cardBody = (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-moss-100 bg-card shadow-sm transition-shadow ${
        active ? "hover:shadow-md" : ""
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-moss-50">
        <Image
          src={resolveImageUrl(product.image)}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className={`object-cover transition-transform duration-300 ${
            active ? "group-hover:scale-105" : "grayscale-[35%]"
          }`}
        />
        {discountPct !== null && (
          <span className="absolute left-2 top-2 rounded-full bg-yellow-300 px-2 py-0.5 text-[11px] font-bold text-moss-950 shadow-sm">
            -{discountPct}%
          </span>
        )}
        <span
          className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm ${
            upcoming ? "bg-amber-500" : "bg-green-600"
          }`}
        >
          {upcoming ? (
            <CalendarClock className="h-3 w-3" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          {upcoming ? "Coming soon" : "Promo"}
        </span>
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-full bg-moss-900 px-3 py-1 text-xs font-medium text-white">
              Out of stock
            </span>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-moss-500">
          {product.brand}
        </p>
        <h3 className="mt-0.5 line-clamp-2 text-sm font-medium text-moss-900 sm:text-base">
          {product.name}
        </h3>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-sm font-semibold text-moss-900 sm:text-base">
              {formatPHP(product.price)}
            </span>
            {product.originalPrice && (
              <span className="font-mono text-xs text-muted-foreground line-through">
                {formatPHP(product.originalPrice)}
              </span>
            )}
          </div>
          <Button
            size="icon"
            variant={canAddToCart ? "default" : "outline"}
            disabled={!canAddToCart}
            aria-label={`Add ${product.name} to cart`}
            className={
              canAddToCart ? "bg-green-600 hover:bg-green-700" : undefined
            }
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addItem(product as unknown as Product);
            }}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>

        {upcoming ? (
          <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-amber-700">
            <CalendarClock className="h-3 w-3" />
            {daysToStart === 0
              ? "Starts today"
              : `Starts in ${daysToStart} ${daysToStart === 1 ? "day" : "days"}`}
          </p>
        ) : (
          daysToEnd !== null && (
            <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-amber-700">
              <Clock className="h-3 w-3" />
              {daysToEnd === 0
                ? "Ends today"
                : `${daysToEnd} ${daysToEnd === 1 ? "day" : "days"} left`}
            </p>
          )
        )}
      </div>

      {/* Disabled watermark overlay for upcoming promos */}
      {upcoming && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
          <span className="-rotate-12 select-none rounded-md border-2 border-amber-600/80 bg-white/90 px-4 py-1 text-xs font-extrabold uppercase tracking-[0.2em] text-amber-700 shadow-sm sm:text-sm">
            Upcoming
          </span>
        </div>
      )}
    </div>
  );

  if (!active) {
    // Upcoming (or otherwise not-yet-active) promos are disabled — no link, no add to cart.
    return (
      <div
        aria-disabled="true"
        className="select-none"
        title="This promo hasn't started yet"
      >
        {cardBody}
      </div>
    );
  }

  return (
    <Link href={buildPromoHref(product)} className="block">
      {cardBody}
    </Link>
  );
}

export default function PromosPage() {
  const [products, setProducts] = React.useState<PromoProduct[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchPromos = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/products?promo=active", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load promo products");

      const json = await res.json();

      // Accept a bare array, or an object wrapping the array.
      const list: PromoProduct[] = Array.isArray(json)
        ? json
        : Array.isArray(json?.products)
          ? json.products
          : Array.isArray(json?.data)
            ? json.data
            : [];

      if (!Array.isArray(json) && list.length === 0) {
        console.warn("Unexpected /api/products response shape:", json);
      }

      setProducts(list);
    } catch {
      setError("We couldn't load the current promos. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  // Live promos first, then upcoming ones — each group sorted by soonest deadline.
  const sorted = React.useMemo(() => {
    return [...products].sort((a, b) => {
      const aUpcoming = isUpcoming(a);
      const bUpcoming = isUpcoming(b);
      if (aUpcoming !== bUpcoming) return aUpcoming ? 1 : -1;

      const aDate = aUpcoming ? a.promoStart : a.promoEnd;
      const bDate = bUpcoming ? b.promoStart : b.promoEnd;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    });
  }, [products]);

  return (
    <>
      <Navbar />
      <main className="container flex-1 py-8 sm:py-12">
        <div className="mb-8 flex flex-col items-start gap-2 sm:mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-300 px-3 py-1 text-xs font-bold uppercase tracking-wide text-moss-950">
            <Sparkles className="h-3.5 w-3.5" />
            Limited time
          </span>
          <h1 className="font-display text-3xl font-medium text-moss-900 sm:text-4xl">
            Special Promos
          </h1>
          <p className="max-w-lg text-sm text-muted-foreground">
            Grab these deals before they&apos;re gone, or get ready for upcoming
            ones — this page updates automatically.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-moss-200 border-t-forest" />
            <p className="text-sm text-muted-foreground">Loading promos...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchPromos}>
              Try again
            </Button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-moss-200 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-moss-50">
              <PackageSearch className="h-7 w-7 text-moss-500" />
            </div>
            <h2 className="font-display text-xl font-medium text-moss-900">
              No active promos right now
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Check back soon, or browse the full catalog in the meantime.
            </p>
            <Button asChild variant="gradient" className="mt-2">
              <Link href="/#shop">Browse all products</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
            {sorted.map((product) => (
              <PromoCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
