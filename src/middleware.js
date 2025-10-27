import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// ✅ Rutas API públicas (sin sesión)
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

// ✅ Páginas protegidas (requieren sesión)
const isProtectedPage = createRouteMatcher(["/(protected)(.*)"]);

// ✅ Rutas de autenticación
const isAuthRoute = createRouteMatcher(["/sign-in", "/sign-up"]);

export default clerkMiddleware((auth, req) => {
  const { userId, sessionClaims } = auth();
  const url = req.nextUrl.clone();

  // 🟢 Permitir rutas API públicas sin sesión
  if (isPublicApiRoute(req)) {
    console.log("🟢 Public API route allowed:", req.url);
    return;
  }

  // 🔒 Proteger automáticamente las rutas /protected/*
  if (isProtectedPage(req)) {
    // ⚡ Activa la sesión de Clerk (importante para useAuth/useUser)
    auth().protect();
  }

  // 🔁 Evitar acceso a sign-in / sign-up si ya está autenticado
  if (isAuthRoute(req) && userId) {
    const role = sessionClaims?.metadata?.role || "client";
    switch (role) {
      case "admin":
        return Response.redirect(new URL("/admin", req.url));
      case "staff":
        return Response.redirect(new URL("/staff-dashboard", req.url));
      default:
        return Response.redirect(new URL("/dashboard", req.url));
    }
  }

  // 🏠 Redirigir raíz "/" al dashboard según rol
  if (url.pathname === "/" && userId) {
    const role = sessionClaims?.metadata?.role || "client";
    switch (role) {
      case "admin":
        url.pathname = "/admin";
        break;
      case "staff":
        url.pathname = "/staff-dashboard";
        break;
      default:
        url.pathname = "/dashboard";
    }
    return Response.redirect(url);
  }

  return; // permitir continuar
});

export const config = {
  matcher: ["/((?!_next|.*\\..*|favicon.ico|sign-in|sign-up).*)"],
};
