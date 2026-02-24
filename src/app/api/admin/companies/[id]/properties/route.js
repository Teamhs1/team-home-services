import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/utils/supabase/server";

export async function GET(req, { params }) {
  try {
    const { id: companyId } = params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "Company ID required" },
        { status: 400 },
      );
    }

    // 🔎 Obtener perfil
    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("id, role")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    // 👑 Permisos
    if (profile.role !== "super_admin") {
      const { data: membership } = await supabaseServer
        .from("company_members")
        .select("id")
        .eq("company_id", companyId)
        .eq("profile_id", profile.id)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json(
          { success: false, message: "Forbidden" },
          { status: 403 },
        );
      }
    }

    // 🔓 Permitido → traer properties
    const { data, error } = await supabaseServer
      .from("properties")
      .select("id, name, address, unit")
      .eq("company_id", companyId)
      .order("name", { ascending: true });

    if (error) {
      console.error("PROPERTIES ERROR:", error);
      return NextResponse.json(
        { success: false, message: "Server error" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (err) {
    console.error("Properties API crash:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
