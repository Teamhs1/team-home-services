import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    // 🧠 Usa auth().protect() para forzar sesión válida
    const { userId } = auth().protect();

    // 🔹 Crear cliente de Supabase con Service Role (solo en backend)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { targetId, newRole } = await req.json();

    if (!targetId || !newRole) {
      return new Response("Missing targetId or newRole", { status: 400 });
    }

    // 🔐 1. Verifica que el usuario actual sea admin
    const { data: adminProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (profileError) {
      console.error("❌ Error fetching admin profile:", profileError.message);
      return new Response("Error fetching admin profile", { status: 500 });
    }

    if (adminProfile?.role !== "admin") {
      console.warn("🚫 Non-admin tried to change a role");
      return new Response("Forbidden", { status: 403 });
    }

    // ✅ 2. Actualiza metadata en Clerk
    await clerkClient.users.updateUserMetadata(targetId, {
      publicMetadata: { role: newRole },
    });

    // ✅ 3. Actualiza el perfil en Supabase
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("clerk_id", targetId);

    if (updateError) {
      console.error("❌ Error updating Supabase:", updateError.message);
      return new Response("Error updating role in Supabase", { status: 500 });
    }

    console.log(`✅ Role for ${targetId} updated to ${newRole}`);
    return new Response("Role updated successfully", { status: 200 });
  } catch (err) {
    console.error("❌ Server error in set-role:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
