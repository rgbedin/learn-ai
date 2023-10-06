import { authMiddleware } from "@clerk/nextjs";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import getConfig from "next/config";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
const authMid = authMiddleware({
  publicRoutes: ["/api/stripe-webhook"],
});

const PUBLIC_FILE = /\.(.*)$/;

export async function middleware(req: NextRequest, event: NextFetchEvent) {
  if (
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.includes("/api/") ||
    req.nextUrl.pathname.includes("/trpc/") ||
    PUBLIC_FILE.test(req.nextUrl.pathname)
  ) {
    return authMid(req, event);
  }

  if (req.nextUrl.locale === "default") {
    const lang = req.headers.get("accept-language");
    const locale = lang && ["en", "pt-BR"].includes(lang) ? lang : "en";

    return NextResponse.redirect(
      new URL(
        `/${locale}${req.nextUrl.pathname}${req.nextUrl.search}`,
        req.url,
      ),
    );
  }

  return authMid(req, event);
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
