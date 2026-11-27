"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";
import { cn, formatPHP } from "@/lib/utils";
import { buildPromoHref } from "@/lib/slug";

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

// How many promos to show (the popup shows up to this many, newest first).
const MAX_PROMOS = 20;
// Delay before the popup appears after page load.
const OPEN_DELAY_MS = 800;
// Shown once per browser session so it doesn't nag on every navigation.
const SESSION_KEY = "quanta-promo-popup-seen";

type PromoProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number | null;
  originalPrice?: number | null;
  inStock: boolean;
  image: string;
  isPromo?: boolean;
  promoStart?: string | null;
  promoEnd?: string | null;
};

function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return "/products/placeholder.jpg";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${IMAGE_BASE_URL}${path}`;
}

// Same rule as the admin page: toggle on AND today inside the date range.
function isPromoActive(product: PromoProduct): boolean {
  if (!product.isPromo) return false;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (product.promoStart && now < new Date(product.promoStart)) return false;
  if (product.promoEnd) {
    const end = new Date(product.promoEnd);
    end.setHours(23, 59, 59, 999);
    if (now > end) return false;
  }
  return true;
}

function formatEnds(product: PromoProduct): string {
  if (!product.promoEnd) return "Limited time";
  const date = new Date(product.promoEnd).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
  return `Ends ${date}`;
}

function percentOff(product: PromoProduct): number | null {
  if (!product.originalPrice || product.price == null) return null;
  if (product.originalPrice <= product.price) return null;
  return Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100,
  );
}

// Newest promos first: latest start date, falling back to the latest id.
function sortLatest(a: PromoProduct, b: PromoProduct): number {
  const aStart = a.promoStart ? new Date(a.promoStart).getTime() : 0;
  const bStart = b.promoStart ? new Date(b.promoStart).getTime() : 0;
  if (aStart !== bStart) return bStart - aStart;
  return String(b.id).localeCompare(String(a.id), undefined, { numeric: true });
}

export function PromoPopup() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [promos, setPromos] = useState<PromoProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [index, setIndex] = useState(0);

  const total = promos.length;
  const goNext = () => setIndex((i) => (i + 1) % Math.max(total, 1));
  const goPrev = () =>
    setIndex((i) => (i - 1 + Math.max(total, 1)) % Math.max(total, 1));

  // Left/right arrow keys while the popup is open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, total]);

  useEffect(() => {
    // Skip entirely if the popup was already seen this session.
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      // sessionStorage unavailable (private mode, etc.) — just show it.
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      try {
        const res = await fetch("/api/products?promo=active", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load promos");
        const data = await res.json();

        const list: PromoProduct[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
            ? data.products
            : Array.isArray(data?.data)
              ? data.data
              : [];

        const live = list
          .filter(isPromoActive)
          .sort(sortLatest)
          .slice(0, MAX_PROMOS);

        if (cancelled) return;
        setPromos(live);

        // Only open if there's something to show.
        if (live.length > 0) {
          timer = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
        }
      } catch {
        // Silent failure: a promo popup should never break the homepage.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // ignore
      }
    }
  }

  // Clicking a promo (or "Shop the promos") goes straight to that promo's own page (/promos/id-slug).
  function openPromo(promo: PromoProduct) {
    handleOpenChange(false);
    router.push(buildPromoHref(promo as Parameters<typeof buildPromoHref>[0]));
  }

  if (isLoading || promos.length === 0) return null;

  const product = promos[index];
  const off = percentOff(product);
  const soldOut = !product.inStock;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/*
        Wide landscape banner. Reference is ~945x386 (about 2.45:1), so on
        desktop the card is locked to that ratio; on mobile it stacks.
        The [&>button] classes restyle the built-in close (X) button so it
        sits on the green panel in the top-right like the reference.
      */}
      <DialogOverlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-[3px]" />

      <DialogContent
        className={cn(
          "w-[calc(100%-2rem)] max-w-[1040px] gap-0 overflow-hidden rounded-3xl border-0 p-0",
          "max-h-[92vh] md:max-h-none",
          "bg-background",
          "[&>button]:right-4 [&>button]:top-4 [&>button]:z-30 [&>button]:rounded-full",
          "[&>button]:bg-black/20 [&>button]:p-1.5 [&>button]:text-white",
          "[&>button]:opacity-100 [&>button:hover]:bg-black/35",
        )}
      >
        {/* Smooth diagonal green gradient (light top-left → deeper bottom-right) */}
        <div className="relative grid max-h-[92vh] overflow-y-auto bg-gradient-to-br from-[#52C86C] to-[#2DB45E] md:aspect-[945/386] md:max-h-none md:grid-cols-[34%_66%] md:overflow-hidden">
          {/* Left: headline + CTA + carousel controls */}
          <div className="relative z-10 flex flex-col justify-center gap-4 px-6 py-7 md:px-9 md:py-6">
            <DialogHeader className="space-y-2.5 text-left">
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-yellow-300 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-moss-950">
                <Sparkles className="h-3 w-3" />
                Limited time
              </span>
              <DialogTitle className="font-display text-3xl font-semibold leading-[1.1] text-[#0a3d22] md:text-[34px]">
                Deals you can grab right now
              </DialogTitle>
              <DialogDescription className="max-w-[17rem] text-sm leading-relaxed text-[#0a3d22]">
                Browse the latest promos and grab them while they last.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => openPromo(product)}
                className="h-11 rounded-xl bg-[#0a4a2a] px-6 font-semibold text-white shadow-md hover:bg-[#08381f]"
              >
                Shop the promos
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                className="h-11 rounded-xl text-[#0a4a2a] hover:bg-white/40"
              >
                Maybe later
              </Button>
            </div>

            {total > 1 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous promo"
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0a4a2a] text-[#0a4a2a] transition-colors hover:bg-[#0a4a2a] hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-1.5">
                  {promos.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`Go to promo ${i + 1}`}
                      aria-current={i === index}
                      className={cn(
                        "h-2 rounded-full transition-all",
                        i === index
                          ? "w-5 bg-[#0a4a2a]"
                          : "w-2 bg-[#0a4a2a]/30 hover:bg-[#0a4a2a]/60",
                      )}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next promo"
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0a4a2a] text-[#0a4a2a] transition-colors hover:bg-[#0a4a2a] hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right: deeper green panel with the product, so it stays distinct
              from the lighter background. Clicking it opens that promo's page. */}
          <div className="relative z-10 p-3 md:p-3.5 md:pl-0">
            <div
              role="button"
              tabIndex={0}
              onClick={() => openPromo(product)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openPromo(product);
                }
              }}
              aria-label={`View ${product.name} promo`}
              className="flex h-full cursor-pointer flex-col items-center gap-5 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1f9d55] via-[#12884a] to-[#0a6f3b] p-5 shadow-lg transition-[filter] hover:brightness-105 md:flex-row md:gap-7 md:px-5 md:py-4"
              aria-live="polite"
            >
              <div className="relative aspect-square w-full max-w-[300px] shrink-0 overflow-hidden rounded-3xl bg-white shadow-xl md:h-full md:max-w-none md:w-auto">
                <Image
                  key={product.id}
                  src={resolveImageUrl(product.image)}
                  alt={product.name}
                  fill
                  className={cn(
                    "object-contain",
                    soldOut && "opacity-40 grayscale",
                  )}
                  sizes="(min-width: 768px) 360px, 300px"
                  priority
                />
                {off !== null && !soldOut && (
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-yellow-300 px-3 py-1 text-xs font-bold text-moss-950 shadow-sm">
                    -{off}%
                  </span>
                )}
                {soldOut && (
                  <span className="absolute inset-0 z-10 flex items-center justify-center bg-white/40">
                    <span className="rounded-full bg-moss-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                      Sold Out
                    </span>
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1 text-center text-white md:text-left">
                <p className="truncate text-[11px] font-medium uppercase tracking-wide text-white/80">
                  {product.brand}
                </p>
                <h3 className="mt-1 line-clamp-2 font-display text-xl font-semibold leading-snug md:text-2xl">
                  {product.name}
                </h3>

                <div className="mt-3 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 md:justify-start">
                  <span className="font-display text-4xl font-semibold md:text-5xl">
                    {product.price != null ? formatPHP(product.price) : "—"}
                  </span>
                  {product.originalPrice ? (
                    <span className="font-mono text-sm text-white/70 line-through">
                      {formatPHP(product.originalPrice)}
                    </span>
                  ) : null}
                </div>

                <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-[#0a4a2a]">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {formatEnds(product)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
