"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

// Shape returned by GET /api/categories (managed in the admin
// "Category Tiles" page). `image_url` is the ready-to-use absolute URL.
type CategoryTile = {
  id: number;
  image: string;
  image_url: string;
  sort_order: number;
};

// Tile layout by position (desktop = 3 columns x 2 rows):
//   1st -> tall   (1 col x 2 rows)   upload 800 x 1040 px
//   2nd -> wide   (2 cols x 1 row)   upload 1640 x 500 px
//   3rd+ -> small (1 col x 1 row)    upload 800 x 500 px
// On mobile each tile uses its own aspect ratio so nothing is cut when the
// image was uploaded at the recommended size.
const TILE_STYLES = [
  "aspect-[10/13] md:aspect-auto md:row-span-2",
  "aspect-[82/25] md:aspect-auto md:col-span-2",
];
const SMALL_TILE = "aspect-[8/5] md:aspect-auto";

export function ShopByCategory() {
  const [tiles, setTiles] = React.useState<CategoryTile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

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
              .filter((t) => t?.image_url)
              .sort((a, b) => a.sort_order - b.sort_order),
          );
        }
      } catch {
        if (!cancelled) setTiles([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing to show (and not loading) -> hide the whole section.
  if (!isLoading && tiles.length === 0) return null;

  return (
    <section className="container py-10">
      <p className="text-xs font-medium uppercase tracking-wide text-green-600">
        Shop by category
      </p>
      <h2 className="mt-2 font-display text-3xl font-medium text-moss-900 sm:text-4xl">
        Find what your home needs
      </h2>

      {isLoading ? (
        <div className="mt-6 flex h-64 items-center justify-center rounded-2xl bg-moss-50 text-moss-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 md:auto-rows-[200px] md:grid-cols-3 lg:auto-rows-[250px]">
          {tiles.map((tile, index) => (
            <Link
              key={tile.id}
              href="/shop"
              className={cn(
                "group relative overflow-hidden rounded-2xl bg-moss-100",
                TILE_STYLES[index] ?? SMALL_TILE,
              )}
            >
              <Image
                src={tile.image_url}
                alt={`Shop by category ${index + 1}`}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                priority={index < 2}
              />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
