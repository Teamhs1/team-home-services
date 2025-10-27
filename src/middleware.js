import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ✅ Rutas API públicas (sin autenticación)
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

// ✅ Rutas protegidas (solo para usuarios con sesión)
const isProtectedRoute = createRouteMatcher([
  "/(protected)(.*)",
  "/dashboard(.*)",
  "/admin(.*)",
  "/jobs(.*)",
  "/profile(.*)",
  "/settings(.*)",
]);

// ✅ Rutas de autenticación
const isAuthRoute = createRouteMatcher(["/sign-in", "/sign-up"]);

export default clerkMiddleware((auth, req) => {
  const { userId } = auth();

  // 🟢 Permitir rutas API públicas sin sesión
  if (isPublicApiRoute(req)) return NextResponse.next();

  // 🔒 Proteger rutas internas
  if (isProtectedRoute(req)) {
    auth().protect();
    return NextResponse.next();
  }

  // 🚫 Redirigir sign-in / sign-up al home (temporalmente)
  if (isAuthRoute(req)) {
    console.log("🚫 Sign-in / Sign-up temporalmente deshabilitado");
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 🏡 Todo lo demás (landing, servicios, contacto, etc.) es público
  return NextResponse.next();
});

export const config = {
  // ⚙️ Ignorar archivos estáticos y rutas internas
  matcher: ["/((?!_next|.*\\..*|favicon.ico).*)"],
};
