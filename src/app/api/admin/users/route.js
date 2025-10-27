import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = auth(); // ✅ usa auth() sin .protect()

    // 🔒 Si no hay sesión, devuelve 401
    if (!userId) {
      console.log("❌ No userId found");
      return new Response("Unauthorized", { status: 401 });
    }

    // 🔍 Verifica rol actual
    const currentUser = await clerkClient.users.getUser(userId);
    const role = currentUser.publicMetadata?.role || "user";

    if (role !== "admin") {
      console.log("❌ Access denied: not admin");
      return new Response("Forbidden", { status: 403 });
    }

    // ✅ Trae la lista de usuarios desde Clerk
    const { data: users } = await clerkClient.users.getUserList({ limit: 100 });

    const formatted = users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.emailAddresses?.[0]?.emailAddress,
      role: u.publicMetadata?.role || "user",
      imageUrl: u.imageUrl,
      createdAt: u.createdAt,
    }));

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Clerk admin route error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
