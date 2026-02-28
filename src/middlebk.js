import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  publicRoutes: [
    "/",
    "/about",
    "/services",
    "/services/(.*)",
    "/contact",

    "/sign-in",
    "/sign-up",

    // Solo APIs realmente públicas
    "/api/robots",
    "/api/sitemap",
  ],
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
