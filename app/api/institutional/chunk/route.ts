// 📁 FILE PATH: app/api/institutional/chunk/route.ts

import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL; // e.g. http://localhost:8000/api

// POST /api/institutional/chunk -> forwards one file piece to Laravel.
// Fields: section, upload_id, index, total, chunk
export async function POST(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  const formData = await req.formData();

  const res = await fetch(`${API_URL}/admin/institutional-items/chunk`, {
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
