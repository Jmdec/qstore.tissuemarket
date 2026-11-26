import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> },
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { message: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  const { trackingNumber } = await params;

  if (!trackingNumber?.trim()) {
    return NextResponse.json(
      { message: "Please enter a tracking number." },
      { status: 400 },
    );
  }

  let laravelResponse: Response;
  try {
    laravelResponse = await fetch(
      `${apiUrl}/track/${encodeURIComponent(trackingNumber)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );
  } catch {
    return NextResponse.json(
      { message: "Could not reach the server. Please try again." },
      { status: 502 },
    );
  }

  const data = await laravelResponse.json().catch(() => ({}));
  return NextResponse.json(data, { status: laravelResponse.status });
}
