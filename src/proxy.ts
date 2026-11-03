import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate only (no DB access here): unauthenticated visitors are sent to the login page
 * before rendering. The real session + permission checks happen on the server in every page,
 * server action and route handler (see src/lib/auth/session.ts).
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname);
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !req.cookies.has("ptl_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = pathname !== "/admin" ? `?next=${encodeURIComponent(pathname)}` : "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/admin/:path*"],
};
