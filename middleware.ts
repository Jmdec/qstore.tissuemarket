import { NextRequest, NextResponse } from "next/server";

const isDev = process.env.NODE_ENV !== "production";

function log(...args: unknown[]) {
  if (isDev) console.log("[middleware]", ...args);
}

function getApiOrigin() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return "";
  try {
    return new URL(apiUrl).origin; // strips any /api path, keeps just https://infinitech-api17.site
  } catch {
    return "";
  }
}

function buildCspHeader(nonce: string) {
  const apiOrigin = getApiOrigin();

  // img-src notes:
  //  - blob:        admin upload previews (URL.createObjectURL)
  //  - ${apiOrigin} images served straight from the Laravel API; needed in
  //                 dev because "https:" does not cover http://localhost:8000
  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https: ${apiOrigin};
    font-src 'self';
    connect-src 'self' ${apiOrigin};
    frame-ancestors 'none';
  `;
  return csp.replace(/\s{2,}/g, " ").trim();
}

// Applies the nonce + CSP header to any NextResponse before it's returned.
function withCsp(response: NextResponse, nonce: string, cspHeader: string) {
  response.headers.set("x-nonce", nonce);
  response.headers.set("Content-Security-Policy", cspHeader);
  return response;
}

export async function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = buildCspHeader(nonce);

  // Pass the nonce + CSP through on the request too, so Next.js can read
  // it via headers() in Server Components and attach it to framework scripts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const pathname = request.nextUrl.pathname;

  // --- Non-admin routes: just attach CSP and continue ---
  if (!pathname.startsWith("/admin")) {
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    return withCsp(response, nonce, cspHeader);
  }

  // --- Admin routes: auth + role check ---
  const token = request.cookies.get("auth_token")?.value;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  log("path:", pathname, "| token present:", !!token);

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  const homeUrl = new URL("/", request.url);

  if (!token) {
    log("no token -> /login");
    return withCsp(NextResponse.redirect(loginUrl), nonce, cspHeader);
  }

  if (!apiUrl) {
    log("no apiUrl configured -> /login");
    return withCsp(NextResponse.redirect(loginUrl), nonce, cspHeader);
  }

  try {
    const res = await fetch(`${apiUrl}/me`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    log("/me status:", res.status, "| role:", data?.user?.role);

    if (!res.ok) {
      log("/me not ok -> /login");
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("auth_token"); // stale/invalid token, clear it here too
      return withCsp(response, nonce, cspHeader);
    }

    const role = data?.user?.role;

    if (role !== "admin") {
      log("role check failed -> /");
      return withCsp(NextResponse.redirect(homeUrl), nonce, cspHeader);
    }
  } catch (err) {
    log("fetch threw:", err);
    return withCsp(NextResponse.redirect(loginUrl), nonce, cspHeader);
  }

  log("passed -> continuing to admin");
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  return withCsp(response, nonce, cspHeader);
}

export const config = {
  // Runs on everything except static assets/api, so CSP applies site-wide
  // while the admin auth branch only triggers for /admin/:path*.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
