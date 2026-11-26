// 📁 PUT THIS FILE AT: app/api/categories/route.ts

import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL; // e.g. http://localhost:8000/api

// GET /api/categories -> proxies Laravel and returns the full category
// objects untouched: { id, label, accent, slug, href, image, image_url,
// alt, scrim, sort_order }. Keep this a plain passthrough — no reshaping
// (e.g. dropping sort_order or renaming fields) — so every consumer
// (the shop-by-category tiles, the admin page, etc.) gets the same,
// complete data. Component-specific mapping belongs in that component.
export async function GET() {
  const res = await fetch(`${API_URL}/categories`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: res.status },
    );
  }

  const categories = await res.json();

  return NextResponse.json(categories);
}

// POST /api/categories -> forwards a multipart upload (field: "image",
// plus label/accent/slug/href/alt/scrim/sort_order) to Laravel to CREATE
// a new category. Editing an existing category goes through
// /api/categories/[id] instead (see that route file) — this endpoint
// only ever creates.
export async function POST(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  const formData = await req.formData();

  const res = await fetch(`${API_URL}/admin/categories`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
