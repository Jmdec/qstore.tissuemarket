"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/types/product";
import { useCart } from "@/context/cart-context";
import { formatPHP } from "@/lib/utils";
import { buildProductHref } from "@/lib/slug";

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";
const PLACEHOLDER_IMAGE = "/products/placeholder.jpg";

function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return PLACEHOLDER_IMAGE;
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  return `${IMAGE_BASE_URL}${path}`;
}

// Badge styles per tag. Keys are matched case-insensitively (see getTagStyle).
const TAG_STYLES: Record<string, string> = {
  bundle: "border-transparent bg-[#006B3F] text-white", // Heritage Forest
};

// Only these tags are shown as a badge on the card (lowercase).
// To show another tag later, add it here and in TAG_STYLES.
const VISIBLE_TAGS = ["bundle"];

function getVisibleTag(tag: string | null | undefined): string | null {
  if (!tag) return null;
  const normalized = tag.trim().toLowerCase();
  return VISIBLE_TAGS.includes(normalized) ? normalized : null;
}

export function ProductCard({ product }: { product: Product }) {
  const { lines, addItem, setQty } = useCart();
  const soldOut = !product.inStock || product.stock <= 0;
  const visibleTag = getVisibleTag(product.tag);

  // Quantity actually in the cart right now (0 if not added yet).
  const line = lines.find((l) => l.product.id === product.id);
  const cartQty = line?.qty ?? 0;

  // Locally staged quantity — the stepper only edits THIS. Nothing is
  // written to the cart until the cart button is pressed.
  const [pendingQty, setPendingQty] = useState(cartQty > 0 ? cartQty : 1);

  // Keep the staged qty in sync if the cart line changes elsewhere
  // (e.g. removed from the cart drawer).
  useEffect(() => {
    setPendingQty(cartQty > 0 ? cartQty : 1);
  }, [cartQty]);

  // Brief "added" feedback on the cart button.
  const [justAdded, setJustAdded] = useState(false);
  const addedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (addedTimeout.current) clearTimeout(addedTimeout.current);
    };
  }, []);

  // Image source with fallback. Starts with the resolved URL and swaps
  // to the placeholder if the image fails to load.
  const [imgSrc, setImgSrc] = useState(resolveImageUrl(product.image));
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset if the product's image changes.
  useEffect(() => {
    setImgSrc(resolveImageUrl(product.image));
  }, [product.image]);

  // Catch images that already failed before React hydrated
  // (onError never fires in that case).
  useEffect(() => {
    const img = imgRef.current;
    if (
      img &&
      img.complete &&
      img.naturalWidth === 0 &&
      imgSrc !== PLACEHOLDER_IMAGE
    ) {
      setImgSrc(PLACEHOLDER_IMAGE);
    }
  }, [imgSrc]);

  const handleAddToCart = (e: React.MouseEvent) => {
    // The whole card is a <Link>, so stop the click from navigating.
    e.preventDefault();
    e.stopPropagation();

    if (cartQty === 0) {
      addItem(product);
      if (pendingQty > 1) setQty(product.id, pendingQty);
    } else {
      setQty(product.id, pendingQty);
    }

    toast.success(
      cartQty > 0
        ? `${product.name} updated in cart`
        : `${product.name} added to cart`,
    );

    setJustAdded(true);
    if (addedTimeout.current) clearTimeout(addedTimeout.current);
    addedTimeout.current = setTimeout(() => setJustAdded(false), 1500);
  };

  const cardInner = (
    <>
      <div
        className={`relative flex aspect-square items-center justify-center overflow-hidden bg-white`}
      >
        <Image
          ref={imgRef}
          src={imgSrc}
          alt={product.name}
          fill
          className={`object-contain p-3 transition-all ${
            soldOut ? "opacity-40 grayscale" : ""
          }`}
          sizes="(max-width: 768px) 50vw, 25vw"
          onError={() => {
            if (imgSrc !== PLACEHOLDER_IMAGE) setImgSrc(PLACEHOLDER_IMAGE);
          }}
        />

        {soldOut && (
          <span className="absolute inset-0 z-10 flex items-center justify-center bg-white/40">
            <span className="rounded-full bg-moss-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              Sold Out
            </span>
          </span>
        )}

        {/* Only "Bundle" shows a badge. Other tags are hidden. */}
        {visibleTag && !soldOut && (
          <Badge
            className={`absolute left-2 top-2 z-10 capitalize sm:left-3 sm:top-3 ${
              TAG_STYLES[visibleTag]
            }`}
          >
            {visibleTag}
          </Badge>
        )}
      </div>

      {/* Tighter padding on phones so the 2-column grid has room to breathe */}
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3 sm:p-4">
        {/* Price sits right under the image */}
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          {product.price != null && (
            <span className="rounded-md bg-yellow-300 px-1.5 py-0.5 font-display text-sm font-semibold text-moss-950">
              {formatPHP(product.price)}
            </span>
          )}
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPHP(product.originalPrice)}
            </span>
          )}
        </div>

        <span className="mt-1 truncate text-[11px] font-semibold uppercase tracking-wide text-green-600">
          {product.brand}
        </span>

        {/* Fixed-height slot: reserves room for 2 lines. */}
        <h3 className="line-clamp-2 min-h-[2.25rem] font-display text-sm font-medium leading-snug text-moss-900">
          {product.name}
        </h3>

        {/* Single-line blurb slot keeps the card compact. */}
        <p className="line-clamp-1 min-h-[1rem] text-xs leading-relaxed text-muted-foreground">
          {product.blurb}
        </p>

        {/* Bottom action row: quantity stepper on the left, add-to-cart
            button on the right. The button is icon-only on mobile and
            shows an "Add to cart" label from the lg breakpoint up. */}
        <div className="mt-auto pt-2">
          <div
            className="flex items-center gap-1.5"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div className="flex min-w-0 flex-1 items-center justify-between rounded-full border border-moss-200 bg-white lg:flex-none lg:shrink-0 lg:justify-start">
              <button
                type="button"
                aria-label={`Decrease quantity of ${product.name}`}
                className="flex h-9 w-7 items-center justify-center text-moss-700 hover:text-green-700 disabled:cursor-not-allowed disabled:text-moss-300"
                disabled={soldOut || pendingQty <= 1}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPendingQty((q) => Math.max(1, q - 1));
                }}
              >
                −
              </button>
              <span className="flex-1 text-center font-mono text-sm text-moss-900 lg:w-5 lg:flex-none">
                {pendingQty}
              </span>
              <button
                type="button"
                aria-label={`Increase quantity of ${product.name}`}
                className="flex h-9 w-7 items-center justify-center text-moss-700 hover:text-green-700 disabled:cursor-not-allowed disabled:text-moss-300"
                disabled={soldOut}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPendingQty((q) => q + 1);
                }}
              >
                +
              </button>
            </div>

            <Button
              type="button"
              size="icon"
              disabled={soldOut}
              aria-live="polite"
              aria-label={
                soldOut
                  ? `${product.name} is sold out`
                  : `Add ${product.name} to cart`
              }
              title={soldOut ? "Sold out" : "Add to cart"}
              className={`h-9 w-9 shrink-0 rounded-full shadow-sm transition-all duration-200 active:scale-90 disabled:cursor-not-allowed disabled:bg-moss-200 disabled:text-moss-500 disabled:opacity-100 lg:w-auto lg:min-w-0 lg:flex-1 lg:gap-1.5 lg:px-2 lg:text-xs lg:font-semibold ${
                justAdded
                  ? "bg-green-700 text-white hover:bg-green-700 lg:scale-100"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
              onClick={handleAddToCart}
            >
              {justAdded ? (
                <Check className="h-4 w-4 shrink-0 animate-bounce" />
              ) : (
                <ShoppingCart className="h-4 w-4 shrink-0" />
              )}
              {/* Label: hidden on mobile, visible on desktop */}
              <span className="hidden truncate whitespace-nowrap lg:inline">
                {soldOut ? "Sold out" : justAdded ? "Added" : "Add to cart"}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <Link
      href={buildProductHref(product)}
      className="paper-fold group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#C6C8C5]/60 bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      {cardInner}
    </Link>
  );
}

// Loading placeholder that mirrors ProductCard's real layout so the grid
// doesn't shift once real cards load in.
export function ProductCardSkeleton() {
  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#C6C8C5]/60 bg-card shadow-sm">
      <Skeleton className="aspect-square w-full rounded-none" />

      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <Skeleton className="h-6 w-16 rounded-md" />
        <Skeleton className="mt-1 h-3 w-16" />
        <Skeleton className="mt-1 h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-1 h-3 w-full" />

        <div className="mt-auto flex items-center gap-1.5 pt-2">
          <Skeleton className="h-9 flex-1 rounded-full lg:w-20 lg:flex-none" />
          <Skeleton className="h-9 w-9 rounded-full lg:w-auto lg:flex-1" />
        </div>
      </div>
    </div>
  );
}
