// 📁 FILE PATH: app/api/institutional/route.ts

import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL; // e.g. http://localhost:8000/api

// GET /api/institutional -> plain passthrough of Laravel's list:
// [{ id, section, image, image_url, sort_order }]
// `section` is one of: "hero" | "story" | "products".
// Images only. No labels or descriptions are stored.
//
// Uploads no longer go through this route. They use /api/institutional/chunk.
export async function GET() {
  const res = await fetch(`${API_URL}/institutional-items`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch institutional images" },
      { status: res.status },
    );
  }

  const items = await res.json();
  return NextResponse.json(items);
}
