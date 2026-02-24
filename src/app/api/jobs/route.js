import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import { getAllowedCompanyIds } from "@/utils/permissions/getAllowedCompanyIds";

export async function GET() {
  const { userId, getToken } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getToken({ template: "supabase" });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    },
  );

  // 🔐 Obtener permisos
  const permissions = await getAllowedCompanyIds(userId);

  // 🔎 Perfil actual
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("clerk_id", userId)
    .single();

  if (!currentProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (
    currentProfile.role !== "admin" &&
    currentProfile.role !== "super_admin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let query = supabase
    .from("cleaning_jobs")
    .select(
      `
      id,
      title,
      service_type,
      scheduled_date,
      status,
      unit_type,
      features,
      created_at,
      assigned_to,
      client_profile_id,
      duration_minutes,
      completed_at,
      property_address,
      company_id
    `,
    )
    .order("created_at", { ascending: false });

  // 👑 SUPER ADMIN ve todo
  if (permissions.role !== "super_admin") {
    query = query.in("company_id", permissions.allowedCompanyIds);
  }

  const { data: jobs, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 🔥 Resolver staff manualmente
  const staffClerkIds = [
    ...new Set(jobs.map((j) => j.assigned_to).filter(Boolean)),
  ];

  let staffMap = {};

  if (staffClerkIds.length > 0) {
    const { data: staffProfiles } = await supabase
      .from("profiles")
      .select("clerk_id, id, full_name, email")
      .in("clerk_id", staffClerkIds);

    staffProfiles?.forEach((profile) => {
      staffMap[profile.clerk_id] = profile;
    });
  }

  const jobsWithRelations = jobs.map((job) => ({
    ...job,
    staff: job.assigned_to ? staffMap[job.assigned_to] || null : null,
  }));

  return NextResponse.json(jobsWithRelations);
}
