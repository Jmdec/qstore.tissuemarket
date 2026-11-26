// 📁 app/api/categories/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// In Next 15, `params` is a Promise and must be awaited.
type RouteContext = { params: Promise<{ id: string }> };

// GET is public in Laravel — no auth needed, left as-is.
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const res = await fetch(`${API_URL}/categories/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: res.status },
    );
  }

  const category = await res.json();
  return NextResponse.json(category);
}

// POST (update) -> requires auth:sanctum in Laravel
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const token = req.cookies.get("auth_token")?.value;
  const formData = await req.formData();

  const res = await fetch(`${API_URL}/admin/categories/${id}`, {
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

// DELETE -> requires auth:sanctum in Laravel
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const token = req.cookies.get("auth_token")?.value;

  const res = await fetch(`${API_URL}/admin/categories/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
