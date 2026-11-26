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

  // No token = guest. This is a normal, successful check — not an auth
  // failure — so we return 200 with a null user instead of 401. Using
  // 401 here made every guest page load show a red request in DevTools,
  // even though nothing was actually wrong.
  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  let laravelResponse: Response;
  try {
    laravelResponse = await fetch(`${apiUrl}/me`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "Could not reach the server. Please try again." },
      { status: 502 },
    );
  }

  const data = await laravelResponse.json().catch(() => ({}));

  if (!laravelResponse.ok) {
    // Token exists but Laravel rejected it (expired/invalid). This *is*
    // a real auth failure, so 401 stays correct here — clear the stale
    // cookie and let the client fall back to guest state.
    const response = NextResponse.json(
      { user: null },
      {
        status: 200,
      },
    );
    if (laravelResponse.status === 401) {
      response.cookies.delete("auth_token");
    }
    return response;
  }

  return NextResponse.json(data);
}
