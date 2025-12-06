import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET() {
    try {
        console.log("👉 DEV MAKE ME ADMIN ENDPOINT HIT");

        const session = await auth();
        console.log("auth() result:", session);

        const { userId } = session;

        if (!userId) {
            console.log("❌ No userId from auth()");
            return new Response("Not authenticated", { status: 401 });
        }

        // Security (dev only)
        console.log("NODE_ENV:", process.env.NODE_ENV);

        if (process.env.NODE_ENV !== "development") {
            console.log("❌ Blocked: not development");
            return new Response("Not allowed in production", { status: 403 });
        }

        console.log("👉 Updating role for user:", userId);

        const updated = await clerkClient.users.updateUser(userId, {
            publicMetadata: { role: "admin" },
        });

        console.log("✔ ROLE UPDATED:", updated);

        return Response.json({
            success: true,
            userId,
            updatedPublicMetadata: updated.publicMetadata,
        });

    } catch (err) {
        console.error("🔥 DEV MAKE ME ADMIN ERROR:", err);
        return new Response("Server error", { status: 500 });
    }
}
