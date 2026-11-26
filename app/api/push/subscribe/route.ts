// app/api/push/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { message: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: "Invalid body." }, { status: 400 });
  }

  const token = request.cookies.get("auth_token")?.value;

  let laravelResponse: Response;
  try {
    laravelResponse = await fetch(`${apiUrl}/push/subscribe`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "Could not reach the server." },
      { status: 502 },
    );
  }

  const data = await laravelResponse.json().catch(() => ({}));
  return NextResponse.json(data, { status: laravelResponse.status });
}
