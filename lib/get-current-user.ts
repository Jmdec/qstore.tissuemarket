import { cookies } from "next/headers";

export async function getCurrentUserId(): Promise<string | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!apiUrl || !token) return null;

  try {
    const res = await fetch(`${apiUrl}/me`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.user?.id ? String(data.user.id) : null;
  } catch {
    return null;
  }
}
