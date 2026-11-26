"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CalendarClock,
  Clock,
  ShoppingCart,
  Sparkles,
  Star,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { formatPHP } from "@/lib/utils";
import type { Category, Product } from "@/types/product";
import { useCart } from "@/context/cart-context";
import { parseProductId } from "@/lib/slug";

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

// Shared look for the details column (same as the product detail page).
const DETAILS_CARD_CLASS =
  "relative flex flex-col overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-[#f7f8ea]/75 via-[#eef5dc]/75 to-[#e2f0d2]/75 p-6 shadow-lg shadow-green-900/10 sm:p-8";

// Pure-CSS green page background (no image): a green gradient with a soft
// light glow in the top-left and a large translucent Q, echoing the mockup.
function GreenBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#f6f9dc] via-green-300 to-green-600"
    >
      {/* Light glow, top-left */}
      <div className="absolute -left-1/4 -top-1/3 h-[80vh] w-[80vh] rounded-full bg-[#fffbe0]/70 blur-3xl" />

      {/* Big translucent calligraphic Q, traced from the brand reference.
          Flush right so the right side runs off-screen like the mockup. */}
      <svg
        viewBox="0 0 430 468"
        preserveAspectRatio="xMaxYMid meet"
        className="absolute right-0 top-1/2 h-[72vh] w-auto max-w-none -translate-y-1/2"
      >
        <defs>
          <linearGradient id="qp-q-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path
          fillRule="evenodd"
          fill="url(#qp-q-fill)"
          d="M171 50C162 56 151 64 144 69C137 74 134 78 128 83C122 88 115 95 109 102C103 109 98 114 90 125C82 136 70 155 64 165C58 175 58 177 54 185C50 193 46 206 43 214C40 222 40 224 38 233C36 242 34 254 34 265C34 276 34 288 36 300C38 312 42 326 45 336C48 346 51 350 55 357C59 364 64 372 70 379C76 386 86 396 94 402C102 408 109 413 119 417C129 421 141 426 152 428C163 430 175 431 184 432C193 433 200 432 207 432C214 432 219 431 227 430C235 429 247 426 255 424C263 422 264 422 274 418C284 414 304 404 315 399C326 394 331 389 337 385C343 381 348 375 351 374C354 373 349 369 357 378C365 387 392 417 401 427C410 437 409 436 412 437C415 438 415 437 418 435C421 433 425 431 429 425C433 419 437 405 444 401C451 397 465 402 469 400C473 398 473 393 469 392C465 391 449 392 444 392C439 392 443 392 439 389C435 386 428 379 420 371C412 363 397 346 393 340C389 334 390 342 394 337C398 332 410 318 416 311C422 304 424 300 428 293C432 286 439 271 442 266C445 261 440 264 445 263C450 262 465 291 469 263C473 235 473 121 469 93C465 65 454 96 445 93C436 90 424 76 417 72C410 68 410 68 404 66C398 64 386 60 379 59C372 58 368 57 362 57C356 57 351 56 344 57C337 58 327 59 319 60C311 61 302 65 298 65C294 65 296 65 295 62C294 59 294 51 292 47C290 43 289 40 286 36C283 32 280 28 275 26C270 24 265 22 259 21C253 20 247 21 240 22C233 23 226 25 219 27C212 29 205 32 197 36C189 40 180 44 171 50ZM254 30C258 30 261 31 264 32C267 33 270 34 273 36C276 38 279 41 281 44C283 47 285 51 286 55C287 59 287 65 287 68C287 71 292 67 284 71C276 75 251 86 241 91C231 96 231 96 223 102C215 108 202 117 192 126C182 135 173 144 164 154C155 164 147 175 140 186C133 197 126 210 121 221C116 232 113 242 110 250C107 258 106 267 105 272C104 277 104 280 105 281C106 282 106 286 108 281C110 276 114 262 118 254C122 246 126 237 130 231C134 225 135 223 140 216C145 209 154 198 161 191C168 184 172 179 180 173C188 167 197 160 207 153C217 146 232 139 242 134C252 129 262 126 270 124C278 122 281 120 290 119C299 118 315 115 326 115C337 115 346 116 355 117C364 118 372 120 380 123C388 126 399 131 406 136C413 141 418 147 423 153C428 159 431 165 434 172C437 179 439 185 440 194C441 203 441 216 440 225C439 234 437 242 435 249C433 256 431 262 427 270C423 278 416 290 409 299C402 308 390 322 385 326C380 330 386 332 380 326C374 320 353 295 346 287C339 279 338 279 336 278C334 277 337 275 332 279C327 283 311 299 306 304C301 309 304 306 304 308C304 310 304 313 304 315C304 317 301 314 307 321C313 328 334 351 339 358C344 365 339 360 339 361C339 362 343 360 337 363C331 366 313 374 303 377C293 380 285 382 276 384C267 386 256 387 247 388C238 389 229 389 220 388C211 387 204 386 195 384C186 382 177 379 168 375C159 371 151 366 143 360C135 354 128 346 122 339C116 332 112 324 108 316C104 308 101 299 99 291C97 283 96 280 95 270C94 260 93 243 94 231C95 219 96 209 99 197C102 185 106 172 110 161C114 150 116 145 122 134C128 123 142 104 147 96C152 88 150 92 155 86C160 80 171 69 179 62C187 55 196 50 203 45C210 40 217 37 223 35C229 33 234 32 239 31C244 30 250 30 254 30Z"
        />
      </svg>
    </div>
  );
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isUpcoming(product: PromoProduct): boolean {
  if (!product.promoStart) return false;
  const start = new Date(product.promoStart);
  start.setHours(0, 0, 0, 0);
  return start > startOfToday();
}

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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function PromoDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();

  const [product, setProduct] = React.useState<PromoProduct | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchProduct = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // The route param is "id-slug" (e.g. "123-tissue-name") — only the
      // leading numeric id is used to identify the product; the slug is
      // purely cosmetic/SEO.
      const productId = parseProductId(params.id);
      if (!productId) throw new Error("Invalid promo id");

      // No dedicated single-product endpoint was available, so we pull the
      // catalog and find the matching id. Swap this for `/api/products/${id}`
      // if/when a single-item endpoint exists.
      const res = await fetch("/api/products", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load product");
      const raw = await res.json();
      // The API may return a bare array or a wrapper like { products: [...] }
      // (the homepage promo strip assumes the wrapped shape) — handle both.
      const list: PromoProduct[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.products)
          ? raw.products
          : [];
      const found = list.find((p) => String(p.id) === productId) ?? null;
      setProduct(found);
      if (!found) setError("We couldn't find that promo.");
    } catch {
      setError("We couldn't load this promo. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  React.useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const upcoming = product ? isUpcoming(product) : false;
  const active = product ? isActiveNow(product) : false;
  const canAddToCart = !!product && active && product.inStock;
  const daysToStart =
    product && upcoming ? daysUntil(product.promoStart) : null;
  const daysToEnd = product ? daysUntil(product.promoEnd) : null;

  const discountPct =
    product?.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : null;

  return (
    <>
      {/* Background layer (pure CSS, no image) */}
      <GreenBackground />

      <Navbar />
      <main className="container flex-1 py-8 sm:py-12">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-sm font-medium text-moss-900 shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-moss-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to promos
        </button>

        {loading ? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl bg-white/80 px-6 py-16 text-center backdrop-blur">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-moss-200 border-t-forest" />
            <p className="text-sm text-muted-foreground">Loading promo...</p>
          </div>
        ) : error || !product ? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl bg-white/80 px-6 py-16 text-center backdrop-blur">
            <h2 className="font-display text-xl font-medium text-moss-900">
              {error ?? "We couldn't find that promo."}
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              It may have ended, or the link might be off.
            </p>
            <Button asChild variant="gradient" className="mt-2">
              <Link href="/promos">Browse all promos</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/60 bg-moss-50 shadow-lg shadow-green-900/10">
              <Image
                src={resolveImageUrl(product.image)}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={`object-cover ${!active ? "grayscale-[35%]" : ""}`}
                priority
              />
              {discountPct !== null && (
                <span className="absolute left-3 top-3 rounded-full bg-yellow-300 px-3 py-1 text-xs font-bold text-moss-950 shadow-sm">
                  -{discountPct}%
                </span>
              )}
              <span
                className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm ${
                  upcoming ? "bg-amber-500" : "bg-green-600"
                }`}
              >
                {upcoming ? (
                  <CalendarClock className="h-3.5 w-3.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {upcoming ? "Coming soon" : "Promo"}
              </span>
              {!product.inStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <span className="rounded-full bg-moss-900 px-4 py-1.5 text-sm font-medium text-white">
                    Out of stock
                  </span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className={DETAILS_CARD_CLASS}>
              {/* Content sits above the decorative layer */}
              <div className="relative flex flex-col">
                <p className="text-xs font-medium uppercase tracking-wide text-moss-500">
                  {product.brand}
                </p>
                <h1 className="mt-1 font-display text-2xl font-medium text-moss-900 sm:text-3xl">
                  {product.name}
                </h1>

                <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-moss-800">
                    {product.rating}
                  </span>
                  <span>({product.reviews} reviews)</span>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="rounded-md bg-yellow-300 px-2 py-1 font-display text-xl font-semibold text-moss-950">
                    {formatPHP(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPHP(product.originalPrice)}
                    </span>
                  )}
                </div>

                {upcoming ? (
                  <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-amber-700">
                    <CalendarClock className="h-4 w-4" />
                    {daysToStart === 0
                      ? "Starts today"
                      : `Starts ${formatDate(product.promoStart)} (in ${daysToStart} ${
                          daysToStart === 1 ? "day" : "days"
                        })`}
                  </p>
                ) : (
                  daysToEnd !== null && (
                    <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-amber-700">
                      <Clock className="h-4 w-4" />
                      {daysToEnd === 0
                        ? "Ends today"
                        : `Ends ${formatDate(product.promoEnd)} (${daysToEnd} ${
                            daysToEnd === 1 ? "day" : "days"
                          } left)`}
                    </p>
                  )
                )}

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {product.blurb}
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <Button
                    size="lg"
                    variant={canAddToCart ? "default" : "outline"}
                    disabled={!canAddToCart}
                    className={
                      canAddToCart
                        ? "h-11 flex-1 gap-2 bg-green-600 hover:bg-green-700 sm:flex-none"
                        : "h-11 flex-1 gap-2 sm:flex-none"
                    }
                    onClick={() => addItem(product as unknown as Product)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {upcoming
                      ? "Not available yet"
                      : !product.inStock
                        ? "Out of stock"
                        : "Add to cart"}
                  </Button>
                </div>

                {upcoming && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    This promo hasn&apos;t started yet — check back once it goes
                    live.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
