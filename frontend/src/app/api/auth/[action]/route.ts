import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, AUTH_COOKIE } from "@/lib/backend";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  if (action !== "login" && action !== "register") {
    return NextResponse.json({ error: "unknown action" }, { status: 404 });
  }
  const body = await req.text();
  const res = await fetch(`${BACKEND_URL}/auth/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const response = NextResponse.json({ user: data.user });
  response.cookies.set(AUTH_COOKIE, data.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
