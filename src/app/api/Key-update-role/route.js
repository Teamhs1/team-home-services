import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";

// Clerk backend client
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Supabase service role client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, role } = body;

    console.log("📦 Body received:", body);

    if (!userId || !role) {
      return NextResponse.json({ message: "Missing data" }, { status: 400 });
    }

    // Authenticated admin
    const session = await auth();
    const adminId = session?.userId;
    console.log("👤 Admin ID:", adminId);

    if (!adminId) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Load admin Clerk user correctly
    const admin = await clerkClient.users.getUser(adminId);
    console.log("🛡 Admin role:", admin.publicMetadata?.role);

    if (admin.publicMetadata?.role !== "admin") {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    console.log("🔄 Updating role in Clerk:", userId, role);

    // Update role in Clerk
    await clerkClient.users.updateUser(userId, {
      publicMetadata: { role },
    });

    // 🔥 Update role in Supabase (using user_id, NOT clerk_id)
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("user_id", userId);

    if (error) {
      console.error("❌ Supabase error:", error);
      return NextResponse.json(
        { message: "Supabase update failed", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, role }, { status: 200 });
  } catch (err) {
    console.error("🔥 SERVER ERROR:", err);
    return NextResponse.json(
      { message: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}
