import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  publicRoutes: [
    "/",
    "/robots",
    "/sitemap",
    "/robots.txt",
    "/sitemap.xml",
    "/api/robots",
    "/api/sitemap",
    "/services(.*)",
    "/contact(.*)",
    "/about(.*)",
    "/sign-in",
    "/sign-up",
  ],
});

export const config = {
  matcher: ["/((?!_next|.*\\..*|favicon.ico).*)"],
};
