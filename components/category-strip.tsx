"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { CATEGORIES, BRANDS, CATEGORY_LABELS } from "@/types/product";
import { cn } from "@/lib/utils";

const LABELS = CATEGORY_LABELS as Record<string, string>;

// Eco-Hygiene Institutional is NOT a product category in the database. It is
// a separate showcase page (no prices, no cart), so it is added to the strip
// as a plain link after the real categories.
const INSTITUTIONAL_HREF = "/eco-hygiene-institutional";
const INSTITUTIONAL_LABEL = "Eco-Hygiene Institutional";

// Unique, non-empty values. Anything in `preferredOrder` comes first (in that
// order); everything else follows alphabetically.
function uniqueSorted(values: unknown[], preferredOrder: readonly string[]) {
  const set = new Set<string>();
  for (const v of values) {
    if (typeof v === "string" && v.trim()) set.add(v.trim());
  }
  const preferred = preferredOrder.filter((v) => set.has(v));
  const rest = [...set]
    .filter((v) => !preferredOrder.includes(v))
    .sort((a, b) => a.localeCompare(b));
  return [...preferred, ...rest];
}

export function CategoryStrip() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");
  const activeBrand = searchParams.get("brand");
  const institutionalActive = pathname === INSTITUTIONAL_HREF;

  // Start with the static lists so the strip isn't empty on first paint or
  // if the request fails; then replace them with what's actually in the
  // database (the categories/brands you enter in the admin Products page).
  const [categories, setCategories] = React.useState<string[]>([...CATEGORIES]);
  const [brands, setBrands] = React.useState<string[]>([...BRANDS]);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load products");
        const data = await res.json();

        // API returns { products: [...] }; also accept a raw array / { data }.
        const products: { category?: string; brand?: string }[] = Array.isArray(
          data,
        )
          ? data
          : Array.isArray(data?.products)
            ? data.products
            : Array.isArray(data?.data)
              ? data.data
              : [];

        if (cancelled || products.length === 0) return;

        setCategories(
          uniqueSorted(
            products.map((p) => p.category),
            CATEGORIES,
          ),
        );
        setBrands(
          uniqueSorted(
            products.map((p) => p.brand),
            BRANDS,
          ),
        );
      } catch {
        // keep the static fallback lists
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const goToCategory = (category: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    params.delete("search");
    params.delete("brand"); // category and brand filters are mutually exclusive
    const qs = params.toString();
    router.push(`/shop${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const goToBrand = (brand: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("brand", brand);
    params.delete("category");
    params.delete("search");
    const qs = params.toString();
    router.push(`/shop${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  return (
    <div className="w-full border-b border-moss-100 bg-moss-50/40">
      <div className="container flex items-center gap-6 overflow-x-auto py-3 text-xs font-bold uppercase tracking-wide text-moss-900 scrollbar-hide sm:gap-8 sm:text-sm">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex shrink-0 items-center gap-1 transition-colors hover:text-green-600",
                activeBrand && "text-green-600",
              )}
            >
              All Brands
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          {/* Landscape / grid layout instead of a single stacked (waterfall)
              column — wraps into rows across multiple columns. Width is
              capped so it doesn't run edge-to-edge on wide screens. */}
          <DropdownMenuContent
            align="start"
            className="grid w-[min(90vw,640px)] grid-cols-2 gap-x-2 gap-y-1 p-2 sm:grid-cols-3 md:grid-cols-4"
          >
            {brands.map((brand) => (
              <DropdownMenuItem
                key={brand}
                onSelect={() => goToBrand(brand)}
                className={cn(
                  "justify-center text-center normal-case",
                  activeBrand === brand && "bg-green-50 text-green-600",
                )}
              >
                {brand}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {categories.map((category) => (
          <button
            key={category}
            onClick={() => goToCategory(category)}
            className={cn(
              "shrink-0 whitespace-nowrap transition-colors hover:text-green-600",
              activeCategory === category && "text-green-600",
            )}
          >
            {LABELS[category] ?? category}
          </button>
        ))}

        {/* Separate showcase page, always last in the strip. */}
        <Link
          href={INSTITUTIONAL_HREF}
          className={cn(
            "shrink-0 whitespace-nowrap normal-case tracking-normal transition-colors hover:text-green-600",
            institutionalActive && "text-green-600",
          )}
        >
          {INSTITUTIONAL_LABEL}
        </Link>
      </div>
    </div>
  );
}
