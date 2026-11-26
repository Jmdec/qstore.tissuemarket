"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarClock, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPHP } from "@/lib/utils";
import { SectionPromoBackground } from "@/components/section-wave-background";
import type { Category } from "@/types/product";
import { buildPromoHref } from "@/lib/slug";

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

// How many promo cards to tease on the homepage strip.
const MAX_HIGHLIGHTS = 8;

// Fixed pixel size for the card, enforced via inline style as a failsafe
// in case Tailwind arbitrary-value classes get purged/cached stale.
const CARD_WIDTH = 168;
const CARD_WIDTH_SM = 200;

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

function PromoHighlightCard({ product }: { product: PromoProduct }) {
  const upcoming = isUpcoming(product);
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
      className="group block flex-shrink-0 overflow-hidden rounded-xl border border-moss-100 bg-card shadow-sm transition-shadow hover:shadow-md"
      style={{ width, maxWidth: width, minWidth: width }}
    >
      <div
        className="relative w-full overflow-hidden bg-moss-50"
        style={{ aspectRatio: "1 / 1" }}
      >
        <Image
          src={resolveImageUrl(product.image)}
          alt={product.name}
          fill
          sizes="200px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {discountPct !== null && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-yellow-300 px-1.5 py-0.5 text-[9px] font-bold text-moss-950 shadow-sm">
            -{discountPct}%
          </span>
        )}
        <span
          className={`absolute right-1.5 top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-white shadow-sm ${
            upcoming ? "bg-amber-500" : "bg-green-600"
          }`}
          title={upcoming ? "Coming soon" : "On promo"}
        >
          {upcoming ? (
            <CalendarClock className="h-2.5 w-2.5" />
          ) : (
            <Sparkles className="h-2.5 w-2.5" />
          )}
        </span>
      </div>

      <div className="p-2">
        <p className="truncate text-[9px] font-medium uppercase tracking-wide text-moss-500">
          {product.brand}
        </p>
        <h3 className="mt-0.5 line-clamp-1 text-[11px] font-medium leading-tight text-moss-900">
          {product.name}
        </h3>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="font-mono text-[11px] font-semibold text-moss-900">
            {formatPHP(product.price)}
          </span>
          {product.originalPrice && (
            <span className="font-mono text-[9px] text-muted-foreground line-through">
              {formatPHP(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function PromoHighlightsSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex-shrink-0" style={{ width: CARD_WIDTH }}>
          <Skeleton className="rounded-xl" style={{ aspectRatio: "1 / 1" }} />
          <Skeleton className="mt-2 h-2.5 w-2/3" />
          <Skeleton className="mt-1.5 h-2.5 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function PromoHighlights() {
  const [products, setProducts] = React.useState<PromoProduct[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchPromos() {
      setLoading(true);
      setFailed(false);
      try {
        const res = await fetch("/api/products?promo=active", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load promo products");
        const data = await res.json();
        const list: PromoProduct[] = Array.isArray(data.products)
          ? data.products
          : [];
        if (!cancelled) setProducts(list);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPromos();
    return () => {
      cancelled = true;
    };
  }, []);

  // Live promos first, then upcoming ones.
  const highlights = React.useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const aUpcoming = isUpcoming(a);
        const bUpcoming = isUpcoming(b);
        if (aUpcoming !== bUpcoming) return aUpcoming ? 1 : -1;
        return 0;
      })
      .slice(0, MAX_HIGHLIGHTS);
  }, [products]);

  // Fail silently on the homepage — no promos, no section.
  if (failed || (!loading && highlights.length === 0)) return null;

  return (
    <section className="relative w-full overflow-hidden">
      <SectionPromoBackground />

      <div className="container py-6 sm:py-8">
        <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-300 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-moss-950">
              <Sparkles className="h-3 w-3" />
              Limited time
            </span>
            <h2 className="mt-1.5 font-display text-xl font-medium text-moss-900 sm:text-2xl">
              Special Promos
            </h2>
          </div>
          <Link
            href="/promos"
            className="group flex flex-shrink-0 items-center gap-1 text-sm font-medium text-forest hover:text-moss-900"
          >
            See all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {loading ? (
          <PromoHighlightsSkeleton />
        ) : (
          <div
            className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
            style={{ display: "flex", flexWrap: "nowrap" }}
          >
            {highlights.map((product) => (
              <div key={product.id} className="snap-start">
                <PromoHighlightCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
