import { NextResponse, type NextRequest } from "next/server";
import { publicRoutes } from "@/lib/constants";
import { updateSession } from "@/server/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const path = request.nextUrl.pathname;

  const hasSession =
    request.cookies.has("sb-access-token") ||
    request.cookies.getAll().some((cookie) => cookie.name.includes("sb-") && cookie.name.endsWith("auth-token"));

  if (!hasSession && !publicRoutes.includes(path)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSession && path === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
