import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_BASE_PATH, AUTH_ROUTES } from "@/lib/route-config";
import { updateSession } from "@/server/supabase/middleware";

const adminRoots = [
  "/admin",
  "/dashboard",
  "/produtos",
  "/insumos",
  "/fichas-tecnicas",
  "/vendas",
  "/caixa",
  "/compras",
  "/fornecedores",
  "/estoque",
  "/producao",
  "/funcionarios",
  "/relatorios",
  "/site",
  "/configuracoes",
];

const publicExactRoutes = new Set([
  ...AUTH_ROUTES,
  "/",
  "/cardapio",
  "/carrinho",
  "/checkout",
  "/endereco",
  "/sobre",
  "/pedido-confirmado",
]);

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const path = request.nextUrl.pathname;

  const hasSession =
    request.cookies.has("sb-access-token") ||
    request.cookies.getAll().some((cookie) => cookie.name.includes("sb-") && cookie.name.endsWith("auth-token"));

  if (path.startsWith("/api/")) {
    return response;
  }

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  if (path === ADMIN_BASE_PATH) {
    return NextResponse.redirect(
      new URL(hasSession ? `${ADMIN_BASE_PATH}/dashboard` : "/login", request.url),
    );
  }

  if (path.startsWith(`${ADMIN_BASE_PATH}/`)) {
    if (!hasSession) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const rewrittenPath = path.replace(ADMIN_BASE_PATH, "") || "/dashboard";
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = rewrittenPath;
    return NextResponse.rewrite(rewriteUrl);
  }

  if (adminRoots.some((root) => path === root || path.startsWith(`${root}/`))) {
    if (!hasSession) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `${ADMIN_BASE_PATH}${path}`;
    return NextResponse.redirect(redirectUrl);
  }

  const isPublicProductPage = path.startsWith("/produto/");

  if (!isPublicProductPage && !publicExactRoutes.has(path) && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSession && path === "/login") {
    return NextResponse.redirect(new URL(`${ADMIN_BASE_PATH}/dashboard`, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
