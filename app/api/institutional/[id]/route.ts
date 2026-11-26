// 📁 PUT THIS FILE AT: app/api/institutional/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Ctx = { params: Promise<{ id: string }> };

// DELETE /api/institutional/[id] -> removes one image.
// There is no update route: to change a picture, delete it and upload a new one.
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const token = req.cookies.get("auth_token")?.value;

  const res = await fetch(`${API_URL}/admin/institutional-items/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
