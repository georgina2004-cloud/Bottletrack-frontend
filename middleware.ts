import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_TOKEN_KEY } from "@/lib/auth";

/**
 * Middleware de Next.js para protección de rutas y redirecciones automáticas
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_TOKEN_KEY)?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute = pathname.startsWith("/dashboard");
  const isAuthRoute = pathname === "/login";

  // 1. Si intenta acceder a una ruta protegida sin token -> Redirigir a /login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Si ya está autenticado e intenta visitar /login -> Redirigir a /dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

/**
 * Rutas a interceptar por el middleware
 */
export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
