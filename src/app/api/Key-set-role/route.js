import { clerkClient, auth } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    const { userId, role } = await req.json();

    // 🔹 Validación de datos
    if (!userId || !role) {
      return new Response("Missing userId or role", { status: 400 });
    }

    // 🔥 Validar autenticación
    const { userId: currentUserId } = auth();
    if (!currentUserId) {
      return new Response("Not authenticated", { status: 401 });
    }

    // 🔥 Obtener el usuario actual desde Clerk
    const currentUser = await clerkClient.users.getUser(currentUserId);

    // 🔥 Validar que sea admin
    if (currentUser.publicMetadata?.role !== "admin") {
      return new Response("Not authorized", { status: 403 });
    }

    // 🔥 Actualizar rol
    await clerkClient.users.updateUser(userId, {
      publicMetadata: { role },
    });

    return new Response("Role updated", { status: 200 });
  } catch (error) {
    console.error("SET ROLE ERROR:", error);
    return new Response("Error updating role", { status: 500 });
  }
}
