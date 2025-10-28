import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { createClerkClient } from "@clerk/backend"; // ✅ nueva API correcta

// ✅ Inicializa Clerk client de forma explícita
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// ✅ Cliente Supabase (clave de servicio)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { userId, newRole } = await req.json();

    if (!userId || !newRole) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    // 🧩 Obtener usuario autenticado actual
    const { userId: adminId } = await auth();

    if (!adminId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ✅ Obtener el usuario admin desde Clerk
    const adminUser = await clerkClient.users.getUser(adminId);
    const adminRole = adminUser?.publicMetadata?.role;

    console.log("🔍 Authenticated admin:", adminId, "role:", adminRole);

    if (adminRole !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    console.log(`🔄 Updating role for user ${userId} → ${newRole}`);

    // ✅ 1. Actualizar rol en Clerk
    await clerkClient.users.updateUser(userId, {
      publicMetadata: { role: newRole },
    });

    // ✅ 2. Confirmar cambio
    const updatedUser = await clerkClient.users.getUser(userId);
    console.log("🧠 Clerk metadata now:", updatedUser.publicMetadata);

    // ✅ 3. Sincronizar en Supabase
    const { data, error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("clerk_id", userId)
      .select();

    if (error) throw error;

    console.log("✅ Supabase updated:", data?.[0]);

    return NextResponse.json(
      {
        message: "Role updated successfully",
        userId,
        newRole,
        clerk: updatedUser.publicMetadata,
        supabase: data?.[0],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error updating role:", err);
    return NextResponse.json(
      { message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
