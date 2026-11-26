"use client";

import * as React from "react";

const PROMOS = [
  "Free shipping on orders over ₱999, nationwide.",
  "New: TeaBiotic probiotic mouthwash now in stock.",
  "Bundle any 3 Fresh paper products and save 10%.",
];

export function PromoBar() {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % PROMOS.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative flex items-center justify-center gap-3 bg-moss-950 px-4 py-2 text-xs font-medium text-moss-50 sm:text-sm">
      <p className="max-w-[85%] truncate text-center sm:max-w-none">
        {PROMOS[index]}
      </p>
    </div>
  );
}
