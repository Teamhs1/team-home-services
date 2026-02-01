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

    // APIs públicas
    "/api/robots",
    "/api/sitemap",
  ],
});

export const config = {
  matcher: [
    // páginas
    "/((?!_next|.*\\..*).*)",

    // 🔥 APIs PRIVADAS (ESTO FALTABA)
    "/api/(.*)",
  ],
};
