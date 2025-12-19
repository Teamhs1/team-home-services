import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  publicRoutes: [
    "/", // Home
    "/about",
    "/services",
    "/services/(.*)", // services dinámicos
    "/contact",

    "/sign-in",
    "/sign-up",

    // APIs públicas
    "/api/robots",
    "/api/sitemap",
  ],
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
