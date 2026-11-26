import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = request.cookies.get("auth_token")?.value;
  const days = request.nextUrl.searchParams.get("days") ?? "30";

  if (!apiUrl) {
    return NextResponse.json(
      { message: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  try {
    const laravelResponse = await fetch(
      `${apiUrl}/admin/stats?days=${encodeURIComponent(days)}`,
      {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      },
    );

    const data = await laravelResponse.json().catch(() => ({}));

    if (!laravelResponse.ok) {
      return NextResponse.json(data, { status: laravelResponse.status });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { message: "Could not reach the server. Please try again." },
      { status: 502 },
    );
  }
}
