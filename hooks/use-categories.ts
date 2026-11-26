"use client";

import { useEffect, useState } from "react";
import { unwrapList } from "@/lib/api";

export type Category = {
  id: number | string;
  name: string;
  slug?: string;
};

// Laravel's CategoryController may name the label field `name` or
// `title` depending on how the model was set up — this normalizes
// whichever one comes back so the rest of the app only deals with `name`.
type RawCategory = {
  id: number | string;
  name?: string;
  title?: string;
  slug?: string;
};

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/categories", {
          headers: { Accept: "application/json" },
        });
        if (!res.ok)
          throw new Error(`Failed to load categories (${res.status})`);

        const payload = await res.json();
        const raw = unwrapList<RawCategory>(payload);

        const normalized = raw
          .map((c) => ({
            id: c.id,
            name: c.name ?? c.title ?? "",
            slug: c.slug,
          }))
          .filter((c) => c.name);

        if (!cancelled) setCategories(normalized);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load categories",
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

  return { categories, isLoading, error };
}
