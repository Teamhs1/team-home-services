import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server"; // ✅ importante

const isPublicApiRoute = createRouteMatcher([
  "/api/webhooks/:path*",
  "/api/upload-photo",
  "/api/job-photos",
  "/api/test-auth",
  "/api/supabase-proxy-token",
  "/api/admin/sync-roles",
  "/api/admin/update-role",
  "/api/jobs/update",
  "/api/jobs/create",
  "/api/jobs/admin-fetch",
  "/api/jobs/delete",
]);

const isProtectedPage = createRouteMatcher(["/(protected)(.*)"]);
const isAuthRoute = createRouteMatcher(["/sign-in", "/sign-up"]);

export default clerkMiddleware((auth, req) => {
  const { userId } = auth();

  // 🟢 Permitir API públicas
  if (isPublicApiRoute(req)) return NextResponse.next();

  // 🔒 Proteger rutas /protected/*
  if (isProtectedPage(req)) {
    auth().protect();
    return NextResponse.next();
  }

  // 🚫 Bloquear acceso directo a /sign-in o /sign-up (temporal)
  if (isAuthRoute(req)) {
    console.log("🚫 Sign-in / Sign-up deshabilitado temporalmente");
    return NextResponse.redirect(new URL("/", req.url)); // ✅ usa NextResponse
  }

  // 🏡 Dejar todo lo demás libre
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*|favicon.ico).*)"],
};
