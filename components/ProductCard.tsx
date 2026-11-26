"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Product, useCart } from "@/context/CartContext";
import { ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";

const PLACEHOLDER_IMAGE = "/products/placeholder.jpg";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  const [imgSrc, setImgSrc] = useState(product.image || PLACEHOLDER_IMAGE);
  const imgRef = useRef<HTMLImageElement>(null);

  // Shows "Added!" feedback on the button after clicking.
  const [justAdded, setJustAdded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset if the product's image changes.
  useEffect(() => {
    setImgSrc(product.image || PLACEHOLDER_IMAGE);
  }, [product.image]);

  // Catch images that already failed before React hydrated.
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

  // Clear the timer if the card unmounts.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleAddToCart = () => {
    addItem(product);
    toast.success(`${product.name} added to cart`);

    setJustAdded(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <div className="group flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-moss-pale">
        <Image
          ref={imgRef}
          src={imgSrc}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          onError={() => {
            if (imgSrc !== PLACEHOLDER_IMAGE) setImgSrc(PLACEHOLDER_IMAGE);
          }}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 border-b border-paper-line pb-4 pt-3">
        <h3 className="font-display text-lg italic leading-snug text-ink">
          {product.name}
        </h3>
        <div className="mt-1 flex items-center justify-between font-mono text-xs text-ink-faint">
          <span>
            ₱{product.price.toFixed(2)} / {product.unit}
          </span>
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          aria-live="polite"
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-widest2 text-white transition-all duration-200 active:scale-95 focus-ring ${
            justAdded ? "scale-105 bg-green-700" : "bg-forest hover:opacity-90"
          }`}
        >
          {justAdded ? (
            <>
              <Check className="h-4 w-4 animate-bounce" />
              Added!
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              Add to cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}
