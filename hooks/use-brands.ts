"use client";

import { useEffect, useState } from "react";
import { unwrapList } from "@/lib/api";

// There's no dedicated /api/brands route in the Laravel API, so brands
// are derived from the product catalog itself. `brand` may come back as
// a plain string or as a related object like { id, name } depending on
// how ProductController::index() eager-loads it — both are handled.
type RawProduct = {
  brand?: string | { id: number | string; name: string } | null;
};

function extractBrandName(brand: RawProduct["brand"]): string | null {
  if (!brand) return null;
  if (typeof brand === "string") return brand.trim() || null;
  if (typeof brand === "object" && "name" in brand)
    return brand.name?.trim() || null;
  return null;
}

export function useBrands() {
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        // per_page is set high to pull the full catalog in one request
        // so we can collect every distinct brand. If the catalog grows
        // large enough that this becomes slow, this should be swapped
        // for a real GET /api/brands endpoint on the Laravel side.
        const res = await fetch("/api/products?per_page=1000", {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`Failed to load products (${res.status})`);

        const payload = await res.json();
        const products = unwrapList<RawProduct>(payload);

        const unique = Array.from(
          new Set(
            products
              .map((p) => extractBrandName(p.brand))
              .filter((name): name is string => Boolean(name)),
          ),
        ).sort((a, b) => a.localeCompare(b));

        if (!cancelled) setBrands(unique);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load brands",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { brands, isLoading, error };
}
