// app/api/logout/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = request.cookies.get("auth_token")?.value;

  if (apiUrl && token) {
    try {
      await fetch(`${apiUrl}/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
    } catch {
      // ignore — clear the cookie regardless
    }
  }

  const response = NextResponse.json({ message: "Logged out." });

  // Explicit path + maxAge:0 — must match the attributes used when the
  // cookie was originally set, or the browser won't recognize this as
  // "the same cookie" and silently ignores the delete.
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
