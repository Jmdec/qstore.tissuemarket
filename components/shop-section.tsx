"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import {
  FilterSidebar,
  DEFAULT_FILTERS,
  FRESH_TOOTHBRUSH,
  type Filters,
} from "@/components/filter-sidebar";
import { SectionCleanBackground } from "@/components/section-wave-background";
import { CATEGORIES, type Product } from "@/types/product";
import { getBrandTypes, getProductType } from "@/lib/product-types";

const ALL = "All items" as const;

// Number of products shown per page.
const PAGE_SIZE = 24;

// Normalise so "Paper And Tissue", "paper and tissue" and "Health & Beauty"
// all compare reliably, whatever casing the backend/types use.
const norm = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/\s*&\s*/g, " and ");

// Category tabs that should no longer be shown.
const HIDDEN_CATEGORIES = new Set(["oral care", "health and beauty"]);

// Display labels. The tab's *value* stays the real category name (so the
// product filter keeps matching what the API returns); only the text changes.
const CATEGORY_LABELS: Record<string, string> = {
  "paper and tissue": "Tissue",
};

const VISIBLE_CATEGORIES = CATEGORIES.filter(
  (cat) => !HIDDEN_CATEGORIES.has(norm(cat)),
);

const categoryLabel = (cat: string) => CATEGORY_LABELS[norm(cat)] ?? cat;

// Products still tagged "Health and Beauty" by the API are shown under
// "Personal Care" instead. Uses the exact Personal Care name from CATEGORIES
// so the tab filter matches.
const PERSONAL_CARE: string =
  CATEGORIES.find((cat) => norm(cat) === "personal care") ?? "Personal Care";

const moveToPersonalCare = (p: Product): Product =>
  norm(p.category) === "health and beauty"
    ? { ...p, category: PERSONAL_CARE as Product["category"] }
    : p;

// Fresh toothbrush products get their own brand so they show up under the
// "Fresh Toothbrush" filter instead of "Fresh".
const splitFreshToothbrush = (p: Product): Product => {
  const name = (p.name ?? "").toLowerCase();
  const brand = (p.brand ?? "").toLowerCase();

  const isToothbrush = name.includes("toothbrush");
  const isFresh = brand.includes("fresh") || name.startsWith("fresh");

  return isToothbrush && isFresh
    ? { ...p, brand: FRESH_TOOTHBRUSH as Product["brand"] }
    : p;
};

// Builds a page list like [1, "...", 4, 5, 6, "...", 20]
function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("...");
  pages.push(total);

  return pages;
}

export function ShopSection() {
  const searchParams = useSearchParams();
  const searchQuery = (searchParams.get("search") ?? "").trim();

  const [products, setProducts] = React.useState<Product[]>([]);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [active, setActive] = React.useState<string>(ALL);
  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        const data = await res.json();

        if (!cancelled) {
          setProducts(
            Array.isArray(data.products)
              ? (data.products as Product[])
                  .map(moveToPersonalCare)
                  .map(splitFreshToothbrush)
              : [],
          );
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  // When a search comes in from the navbar, reset the category tab back to
  // "All items" so the search isn't silently narrowed by a leftover filter.
  React.useEffect(() => {
    if (searchQuery) {
      setActive(ALL);
    }
  }, [searchQuery]);

  // Go back to page 1 whenever the result set changes.
  React.useEffect(() => {
    setPage(1);
  }, [active, filters, searchQuery]);

  const filtered = React.useMemo(() => {
    const q = searchQuery.toLowerCase();

    const result = products.filter((p) => {
      if (q) {
        const matchesSearch =
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      if (active !== ALL && p.category !== active) return false;
      if (filters.brands.length && !filters.brands.includes(p.brand))
        return false;

      // Type filter: apektado lang ang mga brand na may napiling type.
      const selectedForBrand = filters.types.filter((t) =>
        getBrandTypes(p.brand).includes(t),
      );
      if (selectedForBrand.length) {
        const type = getProductType(p);
        if (!type || !selectedForBrand.includes(type)) return false;
      }

      if (p.price > filters.maxPrice) return false;
      if (filters.inStockOnly && !p.inStock) return false;
      if (filters.onSaleOnly && !p.originalPrice) return false;
      return true;
    });

    // Sold-out items (out of stock, regardless of the inStock flag) go last.
    return result.sort((a, b) => {
      const aSoldOut = !a.inStock || a.stock <= 0;
      const bSoldOut = !b.inStock || b.stock <= 0;
      if (aSoldOut === bSoldOut) return 0;
      return aSoldOut ? 1 : -1;
    });
  }, [products, active, filters, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginated = React.useMemo(
    () =>
      filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  const goToPage = (p: number) => {
    setPage(p);
    document
      .getElementById("shop")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="shop" className="relative w-full overflow-hidden bg-[#EEF3EA]">
      <SectionCleanBackground />

      <div className="container py-14 sm:py-20">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-green-600">
              Shop all essentials
            </span>
            {searchQuery ? (
              <>
                <h2 className="mt-2 font-display text-3xl font-medium text-moss-900 sm:text-4xl">
                  Results for &ldquo;{searchQuery}&rdquo;
                </h2>
                <button
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.delete("search");
                    window.history.replaceState({}, "", url.toString());
                    window.location.reload();
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-sm text-moss-600 underline underline-offset-2 hover:text-moss-900"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear search
                </button>
              </>
            ) : (
              <h2 className="mt-2 font-display text-3xl font-medium text-moss-900 sm:text-4xl">
                Browse by category
              </h2>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </div>

        <Tabs value={active} onValueChange={setActive}>
          <TabsList className="mb-8 flex-wrap h-auto">
            <TabsTrigger
              value={ALL}
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
            >
              {ALL}
            </TabsTrigger>
            {VISIBLE_CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
              >
                {categoryLabel(cat)}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <FilterSidebar filters={filters} onChange={setFilters} />
              </div>
            </aside>

            <TabsContent value={active} className="mt-0">
              {status === "loading" ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : status === "error" ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-moss-200 py-20 text-center">
                  <p className="font-display text-lg text-moss-900">
                    Couldn&apos;t load products
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Please refresh the page or try again shortly.
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-moss-200 py-20 text-center">
                  <p className="font-display text-lg text-moss-900">
                    {searchQuery
                      ? `No products found for "${searchQuery}"`
                      : "No products match yet"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {searchQuery
                      ? "Try a different keyword or clear the search."
                      : "Try widening your price range or clearing a filter."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
                    {paginated.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <nav
                      aria-label="Pagination"
                      className="mt-10 flex flex-wrap items-center justify-center gap-2"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => goToPage(currentPage - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Prev
                      </Button>

                      {getPageNumbers(currentPage, totalPages).map((p, i) =>
                        p === "..." ? (
                          <span
                            key={`dots-${i}`}
                            className="px-2 text-moss-600"
                          >
                            …
                          </span>
                        ) : (
                          <Button
                            key={p}
                            size="sm"
                            variant={p === currentPage ? "default" : "outline"}
                            className={
                              p === currentPage
                                ? "bg-green-600 text-white hover:bg-green-600"
                                : ""
                            }
                            aria-current={
                              p === currentPage ? "page" : undefined
                            }
                            onClick={() => goToPage(p)}
                          >
                            {p}
                          </Button>
                        ),
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => goToPage(currentPage + 1)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </nav>
                  )}

                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
                    {filtered.length} products
                  </p>
                </>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Mobile filter sheet */}
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FilterSidebar filters={filters} onChange={setFilters} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </section>
  );
}
