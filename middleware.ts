import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/modules/shared/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = await auth();

  const publicRoutes = [
    "/",
    "/about",
    "/privacy",
    "/terms",
    "/auth/signin",
    "/auth/signup",
  ];

  const publicApiRoutes = ["/api/auth"];

  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    publicApiRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const protectedRoutes = [
    "/dashboard",
    "/validate",
    "/pricing",
    "/billing",
    "/profile",
    "/usage",
    "/invoices",
    "/security",
    "/notifications",
    "/project",
    "/validation",
    "/ai",
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    if (!session?.user) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
