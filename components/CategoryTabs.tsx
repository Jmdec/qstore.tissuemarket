import Link from "next/link";
import { categories } from "@/lib/data";

/** Folder-tab style category index — the explicit "categorized" element
 *  of the redesign, styled like tabs on a paper folder rather than a
 *  dropdown or pill row. */
export default function CategoryTabs() {
  return (
    <nav aria-label="Shop by category" className="border-b border-paper-line">
      <div className="mx-auto max-w-7xl px-4">
        <ul className="flex flex-wrap gap-1.5 pt-6">
          {categories.map((c, i) => (
            <li key={c.href}>
              <Link
                href={c.href}
                className={`folder-tab inline-block border border-b-0 px-4 py-2.5 text-xs font-medium uppercase tracking-widest2 transition focus-ring ${
                  i === 0
                    ? "border-forest bg-forest text-paper"
                    : "border-paper-line text-ink-soft hover:border-ink hover:text-ink"
                }`}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
