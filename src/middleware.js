import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  publicRoutes: [
    "/", // Home
    "/about",
    "/services",
    "/services/(.*)",
    "/contact",

    "/sign-in",
    "/sign-up",

    // APIs realmente públicas
    "/api/robots",
    "/api/sitemap",

    // 🔥 TODAS las APIs pasan sin middleware
    "/api/:path*",
  ],
});

export const config = {
  matcher: [
    // páginas (no _next ni assets)
    "/((?!_next|.*\\..*).*)",
  ],
};
