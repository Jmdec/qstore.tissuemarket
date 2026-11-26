import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { message: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 },
    );
  }

  let laravelResponse: Response;
  try {
    laravelResponse = await fetch(`${apiUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
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
    // Pass through validation errors / status as-is (e.g. 401, 422)
    return NextResponse.json(data, { status: laravelResponse.status });
  }

  const response = NextResponse.json(
    { message: data.message, user: data.user },
    { status: laravelResponse.status },
  );

  // Store the Sanctum token server-side in an httpOnly cookie.
  // Never localStorage — this keeps the token inaccessible to client JS.
  if (data.token) {
    response.cookies.set("auth_token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  return response;
}
