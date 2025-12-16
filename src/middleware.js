import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  publicRoutes: [
    "/",
    "/sign-in",
    "/sign-up",

    // ✅ SOLO APIs públicas reales
    "/api/robots",
    "/api/sitemap",
  ],
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
