// 📁 PUT THIS FILE AT: app/api/banners/route.ts (replaces the current one)

import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL; // e.g. http://localhost:8000/api

// GET /api/banners -> proxies Laravel and returns the full banner objects
// untouched: { id, image, image_url, sort_order }. This used to reshape
// each banner into a { id, src, alt } "Slide" for the Hero carousel, but
// that dropped sort_order and renamed fields, which broke every other
// consumer (like the admin page) that needs the real shape. Any
// component-specific reshaping (e.g. Hero mapping image_url -> src)
// should happen in that component, not here — this route should stay a
// plain passthrough so every consumer gets the same, complete data.
export async function GET() {
  const res = await fetch(`${API_URL}/banners`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch banners" },
      { status: res.status },
    );
  }

  const banners = await res.json();

  return NextResponse.json(banners);
}

// POST /api/banners -> forwards a multipart upload (field: "image") to
// Laravel to CREATE a new banner. Editing an existing banner goes through
// /api/banners/[id] instead (see that route file) — this endpoint only
// ever creates.
export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const res = await fetch(`${API_URL}/banners`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}
