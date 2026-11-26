// 📁 FILE PATH: app/api/institutional/public/route.ts

import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL; // e.g. http://localhost:8000/api

// GET /api/institutional/public -> picture URLs grouped by section:
// { hero: string[], story: string[], products: string[] }
// No token needed. Used by the public Eco-Hygiene Institutional page.
export async function GET() {
  const res = await fetch(`${API_URL}/institutional-items/public`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch institutional images" },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
