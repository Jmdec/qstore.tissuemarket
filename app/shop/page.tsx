"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { CATEGORIES, CATEGORY_LABELS, type Product } from "@/types/product";
import { buildProductHref } from "@/lib/slug";
import { getBrandTypes, getProductType } from "@/lib/product-types";

const ALL = "All Items" as const;

// 24 divides evenly into the 2, 3 and 4 column grids, so the last row is
// always full. Change this one number to adjust the page size.
const PAGE_SIZE = 24;

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

/** Builds [1, "…", 4, 5, 6, "…", 12] style page lists. */
function getPageItems(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const items: (number | string)[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) items.push("ellipsis-start");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < total - 1) items.push("ellipsis-end");

  items.push(total);
  return items;
}

function ShopPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex flex-wrap items-center justify-center gap-1.5"
    >
      <Button
        variant="outline"
        size="sm"
        className="border-[#C6C8C5] bg-white"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </Button>

      {getPageItems(currentPage, totalPages).map((item) =>
        typeof item === "string" ? (
          <span
            key={item}
            className="px-2 text-sm text-[#252927]/60"
            aria-hidden
          >
            …
          </span>
        ) : (
          <Button
            key={item}
            variant={item === currentPage ? "default" : "outline"}
            size="sm"
            className={
              item === currentPage
                ? "min-w-9 bg-[#006B3F] text-white hover:bg-[#006B3F]"
                : "min-w-9 border-[#C6C8C5] bg-white"
            }
            aria-label={`Page ${item}`}
            aria-current={item === currentPage ? "page" : undefined}
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        ),
      )}

      <Button
        variant="outline"
        size="sm"
        className="border-[#C6C8C5] bg-white"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}

export default function ShopPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const gridTopRef = React.useRef<HTMLDivElement>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">(
    "loading",
  );

  const [searchInput, setSearchInput] = React.useState(
    () => searchParams.get("search") ?? "",
  );
  const [active, setActive] = React.useState<string>(
    () =>
      (searchParams.get("category") as (typeof CATEGORIES)[number] | null) ??
      ALL,
  );
  const [filters, setFilters] = React.useState<Filters>(() => ({
    ...DEFAULT_FILTERS,
    brands: searchParams.get("brand") ? [searchParams.get("brand")!] : [],
  }));
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  // The current page lives in the URL (?page=2) so it survives refresh and
  // can be shared. Page 1 has no param.
  const requestedPage = Math.max(1, Number(searchParams.get("page")) || 1);

  const searchParam = searchParams.get("search") ?? "";
  const categoryParam = searchParams.get("category");
  const brandParam = searchParams.get("brand");

  // Keep the search box, active category tab, and brand filter in sync with
  // the URL whenever it changes — covers both initial load and clicking
  // CategoryStrip (navbar) links while already on /shop.
  // Depends on the individual params (not the whole searchParams object) so
  // changing only ?page= does not reset the sidebar filters.
  React.useEffect(() => {
    setSearchInput(searchParam);

    setActive(
      categoryParam &&
        CATEGORIES.includes(categoryParam as (typeof CATEGORIES)[number])
        ? categoryParam
        : ALL,
    );

    setFilters((prev) => ({
      ...prev,
      brands: brandParam ? [brandParam] : [],
      types: [],
    }));
  }, [searchParam, categoryParam, brandParam]);

  const pushParams = (params: URLSearchParams) => {
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    pushParams(params);
    gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Fired when the user clicks a category tab. Updates local state right
  // away (so filtering feels instant) and pushes the category onto the URL
  // so the address bar stays accurate and shareable/refreshable.
  const handleCategoryChange = (value: string) => {
    setActive(value);

    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL) {
      params.delete("category");
    } else {
      params.set("category", value);
    }
    params.delete("page");
    pushParams(params);
  };

  // Any filter change goes back to page 1.
  const handleFiltersChange = (next: Filters) => {
    setFilters(next);

    if (searchParams.get("page")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      pushParams(params);
    }
  };

  const fetchProducts = React.useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      const data = await res.json();

      // Response is shaped like { products: [...] }, but fall back to a
      // plain array or any wrapper key just in case.
      let list: Product[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data?.products)) {
        list = data.products;
      } else if (data && typeof data === "object") {
        const arrayValue = Object.values(data).find((v) => Array.isArray(v));
        if (arrayValue) list = arrayValue as Product[];
      }

      setProducts(list.map(splitFreshToothbrush));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = React.useMemo(() => {
    const q = searchInput.trim().toLowerCase();

    const result = products.filter((p) => {
      if (q) {
        const matchesSearch =
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      if (active === "Baby Care") {
        // Baby Care has no products actually tagged with that category yet —
        // it's really just the Sweetbaby brand's products.
        if (p.brand !== "Sweetbaby") return false;
      } else if (active !== ALL && p.category !== active) {
        return false;
      }

      if (filters.brands.length && !filters.brands.includes(p.brand))
        return false;

      // Type filter: apektado lang ang mga brand na may napiling type.
      // Hal. naka-check ang "Kitchen Towel" ng Fresh → Fresh products lang
      // ang sinasala; ibang brands (kung naka-check din) ay hindi apektado.
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

    // Push out-of-stock products to the end without disturbing the relative
    // order within each group (in-stock items stay in their original order,
    // same for out-of-stock ones).
    return result
      .map((p, i) => ({ p, i }))
      .sort((a, b) => {
        const stockDiff = Number(b.p.inStock) - Number(a.p.inStock);
        return stockDiff !== 0 ? stockDiff : a.i - b.i;
      })
      .map(({ p }) => p);
  }, [products, active, filters, searchInput]);

  // Pagination. Clamp so a stale ?page=99 just shows the last page.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageProducts = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <>
      {/* Paper White (#F8F7F4) page background from the brand palette.
          Quanta Green is reserved for the hero banner and key highlights. */}
      <div aria-hidden className="fixed inset-0 -z-10 bg-[#F8F7F4]" />

      <Navbar />
      <main className="flex-1">
        {/* Hero banner — Quanta Green (#00A552) */}
        <section className="bg-[#00A552]">
          <div className="container flex flex-col items-start justify-between gap-6 py-10 sm:flex-row sm:items-end sm:py-12">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-white/80">
                Shop all essentials
              </span>
              <h1 className="mt-2 font-display text-3xl font-medium text-white sm:text-4xl">
                Shop All Products
              </h1>
              <p className="mt-1 max-w-lg text-sm text-white/90">
                Browse our full catalog of paper, personal care, oral care, and
                baby care essentials.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white lg:hidden"
              onClick={() => setMobileFiltersOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </section>

        <div className="container py-8 sm:py-10">
          <div ref={gridTopRef} className="scroll-mt-28">
            <Tabs value={active} onValueChange={handleCategoryChange}>
              <TabsList className="mb-8 h-auto flex-wrap border border-[#C6C8C5] bg-white">
                <TabsTrigger
                  value={ALL}
                  className="data-[state=active]:bg-[#006B3F] data-[state=active]:text-white"
                >
                  {ALL}
                </TabsTrigger>
                {CATEGORIES.map((cat) => (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    className="data-[state=active]:bg-[#006B3F] data-[state=active]:text-white"
                  >
                    {CATEGORY_LABELS[cat]}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
                <aside className="hidden lg:block">
                  <div className="sticky top-28 rounded-2xl border border-[#C6C8C5] bg-white p-4 shadow-sm">
                    <FilterSidebar
                      filters={filters}
                      onChange={handleFiltersChange}
                    />
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
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#C6C8C5] bg-white py-20 text-center shadow-sm">
                      <p className="font-display text-lg text-moss-900">
                        Couldn&apos;t load products
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Please refresh the page or try again shortly.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={fetchProducts}
                      >
                        Try again
                      </Button>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#C6C8C5] bg-white py-20 text-center shadow-sm">
                      <p className="font-display text-lg text-moss-900">
                        {searchInput
                          ? `No products found for "${searchInput}"`
                          : "No products match yet"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {searchInput
                          ? "Try a different keyword or clear the search."
                          : "Try widening your price range or clearing a filter."}
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="mb-4 text-sm text-[#252927]/70">
                        Showing {startIndex + 1}–
                        {Math.min(startIndex + PAGE_SIZE, filtered.length)} of{" "}
                        {filtered.length} products
                      </p>

                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
                        {pageProducts.map((product) => (
                          <Link
                            key={product.id}
                            href={buildProductHref(product)}
                            className="block"
                          >
                            <ProductCard product={product} />
                          </Link>
                        ))}
                      </div>

                      <ShopPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={goToPage}
                      />
                    </>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Mobile filter sheet */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <FilterSidebar
                  filters={filters}
                  onChange={handleFiltersChange}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </main>
      <Footer />
    </>
  );
}
