import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { message: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();

  let laravelResponse: Response;
  try {
    laravelResponse = await fetch(
      `${apiUrl}/products/best-sellers${qs ? `?${qs}` : ""}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        next: { revalidate: 300 }, // cache 5 min, avoid hammering Laravel
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
