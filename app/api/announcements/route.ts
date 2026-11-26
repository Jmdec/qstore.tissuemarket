import { NextRequest, NextResponse } from "next/server";
import { sendAnnouncementEmails } from "@/lib/emails/send-announcement-emails";

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
      `${apiUrl}/admin/announcements${qs ? `?${qs}` : ""}`,
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
    const response = NextResponse.json(data, { status: 401 });
    response.cookies.delete("auth_token");
    return response;
  }

  return NextResponse.json(data, { status: laravelResponse.status });
}

export async function POST(request: NextRequest) {
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
    laravelResponse = await fetch(`${apiUrl}/admin/announcements`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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

  if (laravelResponse.status === 401) {
    const response = NextResponse.json(data, { status: 401 });
    response.cookies.delete("auth_token");
    return response;
  }

  // Only fire off subscriber emails once the announcement was actually
  // created successfully on the Laravel side, and only if it's published.
  if (laravelResponse.ok) {
    const payload = body as {
      title?: string;
      body?: string;
      url?: string | null;
      is_published?: boolean;
    };

    if (payload?.is_published && payload.title && payload.body) {
      // Fire-and-forget-ish: don't let a slow/failed email batch delay or
      // fail the API response the admin UI is waiting on. Errors are
      // logged server-side for now — see note below re: background jobs.
      sendAnnouncementEmails({
        title: payload.title,
        body: payload.body,
        url: payload.url,
      })
        .then((result) => {
          console.log("[announcements] emails sent:", result);
        })
        .catch((err) => {
          console.error("[announcements] email send failed:", err);
        });
    }
  }

  return NextResponse.json(data, { status: laravelResponse.status });
}
