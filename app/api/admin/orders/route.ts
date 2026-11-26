import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = request.cookies.get("auth_token")?.value;

  if (!apiUrl) {
    return NextResponse.json(
      { message: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  if (!token) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();

  let laravelResponse: Response;
  try {
    laravelResponse = await fetch(
      `${apiUrl}/admin/orders${qs ? `?${qs}` : ""}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
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

  if (laravelResponse.status === 401) {
    // Stale/invalid token — clear it so the client falls back to guest state.
    const response = NextResponse.json(data, { status: 401 });
    response.cookies.delete("auth_token");
    return response;
  }

  // Normalize so the frontend never chokes on a missing `items` array,
  // regardless of what shape Laravel returns.
  if (Array.isArray(data?.orders)) {
    data.orders = data.orders.map((order: Record<string, unknown>) => ({
      ...order,
      items: Array.isArray(order.items) ? order.items : [],
    }));
  }

  return NextResponse.json(data, { status: laravelResponse.status });
}
