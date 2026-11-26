"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { SectionPaperBackground } from "@/components/section-wave-background";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const COLLECTIONS = [
  {
    name: "Health essentials",
    href: "/shop?category=Health%20Care",
    image: "/shop_by_need-02.jpg",
  },
  {
    name: "Household must haves",
    href: "/shop?category=Household",
    image: "/shop_by_need-01.jpg",
  },
  {
    name: "Kitchen companion",
    href: "/shop?category=Kitchen",
    image: "/shop_by_need-03.jpg",
  },
  {
    name: "Mother & baby needs",
    href: "/shop?category=Baby%20Care",
    image: "/shop_by_need-04.jpg",
  },
] as const;

// Slideshow settings.
const MAX_SLIDES = 10;
// All four tiles change together, one "page" at a time. Page N shows the
// N-th image of every tile (so image N of each tile should be the same brand).
const PAGE_INTERVAL_MS = 3000;
// Fade duration. Keep in sync with `duration-700` on the Slide below.
const FADE_MS = 700;

// Shape returned by GET /api/categories. Images can be listed as
//   images: ["https://…/a.jpg", …]  or  images: [{ image_url: "…" }, …]
// A tile with only `image_url` still works as a single-image tile.
type TileImage = string | { image_url?: string; url?: string };

type CategoryTile = {
  id: number;
  image_url?: string;
  images?: TileImage[];
  sort_order: number;
};

function getTileImages(tile: CategoryTile | undefined): string[] {
  if (!tile) return [];

  const fromList = (tile.images ?? [])
    .map((img) =>
      typeof img === "string" ? img : (img?.image_url ?? img?.url ?? ""),
    )
    .filter((src): src is string => Boolean(src));

  const urls =
    fromList.length > 0 ? fromList : tile.image_url ? [tile.image_url] : [];

  return urls.slice(0, MAX_SLIDES);
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

type SlideLayer = "active" | "last" | "hidden";

// One slide: the image fills the whole tile (object-cover, same as the
// original single-image tiles). The incoming slide fades in ON TOP of the
// outgoing one, which stays fully visible underneath until the fade is done,
// so the tile never dips to the green background mid-transition.
function Slide({
  src,
  alt,
  sizes,
  layer,
  priority,
  onLoad,
}: {
  src: string;
  alt: string;
  sizes: string;
  layer: SlideLayer;
  priority?: boolean;
  onLoad?: () => void;
}) {
  const target = layer === "hidden" ? 0 : 1;

  // A slide that is brand new and not the outgoing one always starts at
  // opacity 0 and only then animates to its target, so it fades in even when
  // it was mounted at the very moment it became active. The fade itself is
  // set inline so no global CSS can switch it off.
  const [opacity, setOpacity] = React.useState(layer === "last" ? 1 : 0);

  React.useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setOpacity(target));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [target]);

  return (
    <div
      aria-hidden={layer !== "active"}
      className="absolute inset-0"
      style={{
        opacity,
        zIndex: layer === "active" ? 2 : 1,
        transition: `opacity ${FADE_MS}ms ease-in-out`,
        willChange: "opacity",
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "eager"}
        className="object-cover object-center"
        onLoad={onLoad}
      />
    </div>
  );
}

function CollectionCard({
  collection,
  images,
  tileIndex,
  page,
  lastPage,
  onSelectPage,
  onPause,
  onResume,
  sizes = "100vw",
  className = "",
}: {
  collection: (typeof COLLECTIONS)[number];
  // undefined = still loading -> skeleton
  images: string[] | undefined;
  tileIndex: number;
  // Shared page state, owned by LifestyleCollections.
  page: number;
  lastPage: number | null;
  onSelectPage: (page: number) => void;
  onPause: () => void;
  onResume: () => void;
  sizes?: string;
  className?: string;
}) {
  const count = images?.length ?? 0;
  const multiple = count > 1;

  // A tile with fewer images than the current page just wraps around.
  const active = count > 0 ? page % count : 0;
  const last = count > 0 && lastPage !== null ? lastPage % count : null;

  const [firstLoaded, setFirstLoaded] = React.useState(false);

  // Reset the "first image loaded" flag if the first image itself changes.
  const firstSrc = images?.[0];
  React.useEffect(() => {
    setFirstLoaded(false);
  }, [firstSrc]);

  // Only mount the slides that can be on screen soon: the current one, the
  // one fading out, and its two neighbours (so the next image is preloaded).
  const mounted = new Set<number>();
  if (count > 0) {
    mounted.add(active);
    if (last !== null) mounted.add(last);
    mounted.add((active + 1) % count);
    mounted.add((active - 1 + count) % count);
  }

  const stop = (e: React.MouseEvent) => {
    // The whole card is a <Link>, so don't navigate on dot clicks.
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Link
      href={collection.href}
      className={`group relative block overflow-hidden rounded-2xl bg-green-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${className}`}
      onMouseEnter={onPause}
      onMouseLeave={onResume}
      onFocus={onPause}
      onBlur={onResume}
    >
      {(!images || !firstLoaded) && (
        <Skeleton className="absolute inset-0 rounded-none" />
      )}

      {images?.map((src, i) =>
        mounted.has(i) ? (
          <Slide
            key={`${i}-${src}`}
            src={src}
            alt={
              multiple
                ? `${collection.name}, image ${i + 1} of ${count}`
                : collection.name
            }
            sizes={sizes}
            layer={i === active ? "active" : i === last ? "last" : "hidden"}
            priority={tileIndex < 2 && i === 0}
            onLoad={i === 0 ? () => setFirstLoaded(true) : undefined}
          />
        ) : null,
      )}

      {multiple && (
        <div
          className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/25 px-2 py-1.5 backdrop-blur-sm"
          role="tablist"
          aria-label={`Slides for ${collection.name}`}
        >
          {images?.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Show image ${i + 1} of ${count}`}
              onClick={(e) => {
                stop(e);
                onSelectPage(i);
              }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === active
                  ? "w-5 bg-white"
                  : "w-1.5 bg-white/60 hover:bg-white/90",
              )}
            />
          ))}
        </div>
      )}
    </Link>
  );
}

export function LifestyleCollections() {
  // null = still loading, [] = loaded but none / failed
  const [tiles, setTiles] = React.useState<CategoryTile[] | null>(null);

  // One shared page for all four tiles, so they always change together.
  // `last` is the page we just left; it stays mounted underneath while the
  // new page fades in. Kept in one object so both change in the same update.
  const [pager, setPager] = React.useState<{
    page: number;
    last: number | null;
  }>({ page: 0, last: null });
  const page = pager.page;
  const lastPage = pager.last;
  const [paused, setPaused] = React.useState(false);
  const reducedMotion = usePrefersReducedMotion();

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/categories", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load categories");
        const data = await res.json();

        // Raw array, or wrapped as { categories: [...] } / { data: [...] }.
        const list: CategoryTile[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.categories)
            ? data.categories
            : Array.isArray(data?.data)
              ? data.data
              : [];

        if (!cancelled) {
          setTiles(
            list
              .filter((t) => t && getTileImages(t).length > 0)
              .sort((a, b) => a.sort_order - b.sort_order),
          );
        }
      } catch {
        if (!cancelled) setTiles([]); // fall back to the static images
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Images for slot i: the i-th tile from the admin (one or many), else the
  // static fallback. While loading (tiles === null) it's undefined so a
  // skeleton shows instead of flashing the old images.
  const imagesFor = (index: number): string[] | undefined => {
    if (tiles === null) return undefined;
    const fromApi = getTileImages(tiles[index]);
    return fromApi.length > 0 ? fromApi : [COLLECTIONS[index].image];
  };

  // Number of pages = the most images any single tile has.
  const pageCount =
    tiles === null
      ? 1
      : Math.max(1, ...COLLECTIONS.map((_, i) => imagesFor(i)?.length ?? 0));

  const goTo = React.useCallback(
    (next: number) => {
      if (pageCount === 0) return;
      const target = ((next % pageCount) + pageCount) % pageCount;
      setPager((cur) =>
        target === cur.page ? cur : { page: target, last: cur.page },
      );
    },
    [pageCount],
  );

  // Keep the page valid if the number of pages changes.
  React.useEffect(() => {
    if (page >= pageCount) {
      setPager({ page: 0, last: null });
    }
  }, [page, pageCount]);

  // Once the fade has finished, drop the outgoing page so it is ready to
  // fade in again (from opacity 0) the next time it comes around.
  React.useEffect(() => {
    if (lastPage === null) return;
    const id = window.setTimeout(
      () =>
        setPager((cur) => (cur.last === null ? cur : { ...cur, last: null })),
      FADE_MS + 50,
    );
    return () => window.clearTimeout(id);
  }, [lastPage]);

  // Autoplay. Restarts whenever the page changes, so clicking a dot gives the
  // customer a full interval on the page they chose.
  React.useEffect(() => {
    if (tiles === null || pageCount <= 1 || paused || reducedMotion) return;
    const id = window.setTimeout(() => goTo(page + 1), PAGE_INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [tiles, page, pageCount, paused, reducedMotion, goTo]);

  const shared = {
    page,
    lastPage,
    onSelectPage: goTo,
    onPause: () => setPaused(true),
    onResume: () => setPaused(false),
  };

  return (
    <section className="relative w-full overflow-hidden">
      <SectionPaperBackground />

      <div className="container py-14 sm:py-16">
        <div className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-wide text-green-600">
            Shop by category
          </span>
          <h2 className="mt-2 font-display text-3xl font-medium text-moss-900 sm:text-4xl">
            Find what your home needs
          </h2>
        </div>

        {/* Desktop (lg+): the whole grid keeps the 1240 x 520 shape the admin
            page assumes (two 400px columns + one 820px span, 250px rows,
            20px gaps), so every tile keeps its slot ratio at any width.
            Below lg: each tile uses its own aspect ratio. */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:aspect-[1240/520] lg:grid-cols-3 lg:grid-rows-2">
          {/* Tile 1 – tall (800 x 1040 = 10:13) */}
          <CollectionCard
            collection={COLLECTIONS[0]}
            images={imagesFor(0)}
            tileIndex={0}
            {...shared}
            sizes="(min-width: 1024px) 34vw, 100vw"
            className="aspect-[10/13] lg:col-span-1 lg:row-span-2 lg:aspect-auto lg:h-full"
          />

          {/* Tile 2 – wide (1640 x 500 = 82:25) */}
          <CollectionCard
            collection={COLLECTIONS[1]}
            images={imagesFor(1)}
            tileIndex={1}
            {...shared}
            sizes="(min-width: 1024px) 66vw, 100vw"
            className="aspect-[82/25] lg:col-span-2 lg:aspect-auto lg:h-full"
          />

          {/* Tiles 3 & 4 – small (800 x 500 = 8:5) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:col-span-2 lg:h-full lg:grid-rows-1">
            <CollectionCard
              collection={COLLECTIONS[2]}
              images={imagesFor(2)}
              tileIndex={2}
              {...shared}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="aspect-[8/5] lg:aspect-auto lg:h-full"
            />
            <CollectionCard
              collection={COLLECTIONS[3]}
              images={imagesFor(3)}
              tileIndex={3}
              {...shared}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="aspect-[8/5] lg:aspect-auto lg:h-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
