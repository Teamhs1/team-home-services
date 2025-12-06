import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req) {
    try {
        const body = await req.json();
        const { userId, key } = body;

        if (!userId || !key) {
            return new Response("Missing data", { status: 400 });
        }

        // Validar clave secreta del servidor
        if (key !== process.env.SUPER_ADMIN_KEY) {
            return new Response("Invalid admin key", { status: 401 });
        }

        // Actualizar rol en Clerk
        await clerkClient.users.updateUser(userId, {
            publicMetadata: { role: "admin" },
        });

        return new Response("OK", { status: 200 });

    } catch (err) {
        console.error(err);
        return new Response("Server error", { status: 500 });
    }
}
