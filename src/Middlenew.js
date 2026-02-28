import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // SOLO proteger rutas privadas
    "/dashboard(.*)",
    "/admin(.*)",
    "/staff(.*)",
    "/api/(.*)",

    // agrega aquí lo que realmente necesita auth
  ],
};
