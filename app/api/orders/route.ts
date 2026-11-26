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
    return NextResponse.json(
      { message: "You need to be logged in to view your orders." },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();

  let laravelResponse: Response;
  try {
    laravelResponse = await fetch(`${apiUrl}/orders${qs ? `?${qs}` : ""}`, {
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
  return NextResponse.json(data, { status: laravelResponse.status });
}

// POST handler unchanged

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
    return NextResponse.json(
      { message: "You need to be logged in to place an order." },
      { status: 401 },
    );
  }

  let incomingForm: FormData;
  try {
    incomingForm = await request.formData();
  } catch {
    return NextResponse.json(
      { message: "Invalid form data." },
      { status: 400 },
    );
  }

  let laravelResponse: Response;
  try {
    laravelResponse = await fetch(`${apiUrl}/orders`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: incomingForm,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "Could not reach the server. Please try again." },
      { status: 502 },
    );
  }

  const data = await laravelResponse.json().catch(() => ({}));

  return NextResponse.json(data, { status: laravelResponse.status });
}
