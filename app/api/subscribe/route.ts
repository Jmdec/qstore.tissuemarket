import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/subscriber";
import { subscribeConfirmationEmail } from "@/lib/emails/subscribe-confirmation";

export async function POST(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { message: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 },
    );
  }

  if (!body.email) {
    return NextResponse.json(
      { message: "Email is required." },
      { status: 400 },
    );
  }

  // 1. Persist the subscriber in Laravel
  let laravelResponse: Response;
  try {
    laravelResponse = await fetch(`${apiUrl}/subscribe`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: body.email }),
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
    return NextResponse.json(data, { status: laravelResponse.status });
  }

  // 2. Send confirmation email — don't fail the whole request if this errors,
  // the subscriber is already saved either way.
  try {
    const { subject, html, text } = subscribeConfirmationEmail(body.email);
    await sendMail({ to: body.email, subject, html, text });
  } catch (err) {
    console.error("Failed to send subscribe confirmation email:", err);
  }

  return NextResponse.json(data, { status: laravelResponse.status });
}
