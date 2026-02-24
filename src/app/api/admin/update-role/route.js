import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { createClerkClient } from "@clerk/backend";

/* =========================
   🔑 Clients
========================= */

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/* =========================
   🚀 POST
========================= */

export async function POST(req) {
  try {
    const { userId: targetClerkId, newRole } = await req.json();

    if (!targetClerkId || !newRole) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    /* =========================
       🔐 1️⃣ Auth user
    ========================= */

    const { userId: adminClerkId } = await auth();

    if (!adminClerkId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    /* =========================
       🧠 2️⃣ Get current admin profile
    ========================= */

    const { data: currentUser, error: currentUserError } = await supabase
      .from("profiles")
      .select("role, company_id")
      .eq("clerk_id", adminClerkId)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json(
        { message: "Admin profile not found" },
        { status: 404 },
      );
    }

    const { role: adminRole, company_id: adminCompanyId } = currentUser;

    /* =========================
       🛑 3️⃣ Permission checks
    ========================= */

    if (!["super_admin", "admin"].includes(adminRole)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    /* =========================
       🔒 HARD BLOCK: never allow assigning super_admin via API
    ========================= */

    if (newRole === "super_admin") {
      return NextResponse.json(
        { message: "super_admin role cannot be assigned via API" },
        { status: 403 },
      );
    }

    /* =========================
       🎯 4️⃣ Get target user
    ========================= */

    const { data: targetUser, error: targetError } = await supabase
      .from("profiles")
      .select("id, role, company_id")
      .eq("clerk_id", targetClerkId)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { message: "Target user not found" },
        { status: 404 },
      );
    }

    /* =========================
       🔒 Prevent self-degrading super_admin
    ========================= */

    if (adminClerkId === targetClerkId && targetUser.role === "super_admin") {
      return NextResponse.json(
        { message: "You cannot change your own super_admin role" },
        { status: 403 },
      );
    }

    /* =========================
       🔒 Prevent removing last super_admin
    ========================= */

    if (targetUser.role === "super_admin") {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "super_admin");

      if (count <= 1) {
        return NextResponse.json(
          { message: "System must have at least one super_admin" },
          { status: 403 },
        );
      }
    }

    /* =========================
       🏢 Company restriction (admin only)
    ========================= */

    if (adminRole === "admin") {
      if (targetUser.company_id !== adminCompanyId) {
        return NextResponse.json(
          { message: "You can only modify users in your company" },
          { status: 403 },
        );
      }

      if (targetUser.role === "admin") {
        return NextResponse.json(
          { message: "Admins cannot modify other admins" },
          { status: 403 },
        );
      }

      if (targetUser.role === "super_admin") {
        return NextResponse.json(
          { message: "Admins cannot modify super_admin users" },
          { status: 403 },
        );
      }
    }

    /* =========================
       🔄 6️⃣ Update Supabase
    ========================= */

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("clerk_id", targetClerkId)
      .select()
      .single();

    if (updateError) throw updateError;

    /* =========================
       🔁 7️⃣ Sync to Clerk
    ========================= */

    await clerkClient.users.updateUser(targetClerkId, {
      publicMetadata: {
        role: newRole,
      },
    });

    return NextResponse.json(
      {
        message: "Role updated successfully",
        userId: targetClerkId,
        newRole,
        profile: updatedProfile,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("❌ Error updating role:", err);

    return NextResponse.json(
      { message: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
