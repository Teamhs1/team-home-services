import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req) {
    try {
        const { userId, role } = await req.json();

        if (!userId) {
            return new Response("Missing userId", { status: 400 });
        }

        // 🔥 Aquí se actualiza el rol en Clerk
        await clerkClient.users.updateUser(userId, {
            publicMetadata: { role },
        });

        return new Response("Role updated", { status: 200 });
    } catch (error) {
        console.error(error);
        return new Response("Error updating role", { status: 500 });
    }
} import { clerkClient, auth } from "@clerk/nextjs/server";

export async function POST(req) {
    try {
        const { userId, role } = await req.json();

        // 🔹 Validación básica
        if (!userId || !role) {
            return new Response("Missing userId or role", { status: 400 });
        }

        // 🔥 Obtener usuario que está haciendo la solicitud
        const { userId: currentUserId } = auth();

        if (!currentUserId) {
            return new Response("Not authenticated", { status: 401 });
        }

        // 🔥 Obtener el usuario actual desde Clerk
        const currentUser = await clerkClient.users.getUser(currentUserId);

        // 🔥 Validar si el que llama a la API es admin
        if (currentUser.publicMetadata?.role !== "admin") {
            return new Response("Not authorized", { status: 403 });
        }

        // 🔥 Actualizar el rol del usuario objetivo
        await clerkClient.users.updateUser(userId, {
            publicMetadata: { role },
        });

        return new Response("Role updated", { status: 200 });

    } catch (error) {
        console.error("SET ROLE ERROR:", error);
        return new Response("Error updating role", { status: 500 });
    }
}

