import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  // Opcionalmente puedes definir rutas públicas (no protegidas)
  publicRoutes: ["/", "/api/public(.*)"],
});

export const config = {
  matcher: [
    // Protege todo excepto archivos estáticos y _next
    "/((?!_next|.*\\..*|favicon.ico).*)",
  ],
};
