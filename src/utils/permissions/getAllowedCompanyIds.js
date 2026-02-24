import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function getAllowedCompanyIds(clerkUserId) {
  // 🔹 Obtener perfil
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, active_company_id")
    .eq("clerk_id", clerkUserId)
    .single();

  if (profileError || !profile) {
    throw new Error("Profile not found");
  }

  const role = profile.role?.toLowerCase();

  // 👑 SUPER ADMIN
  if (role === "super_admin") {
    return {
      role,
      isSuperAdmin: true,
      activeCompanyId: null,
      allowedCompanyIds: [],
    };
  }

  if (!profile.active_company_id) {
    throw new Error("No active company assigned");
  }

  // 🔹 Obtener company actual
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, company_type")
    .eq("id", profile.active_company_id)
    .single();

  if (companyError || !company) {
    throw new Error("Company not found");
  }

  let allowedCompanyIds = [company.id];

  // 🏗 SERVICE PROVIDER → puede ver companies que maneja
  if (company.company_type === "service_provider") {
    const { data: managedCompanies } = await supabase
      .from("companies")
      .select("id")
      .eq("service_provider_id", company.id);

    const managedIds = managedCompanies?.map((c) => c.id) || [];

    allowedCompanyIds = [company.id, ...managedIds];
  }

  return {
    role,
    isSuperAdmin: false,
    activeCompanyId: company.id,
    allowedCompanyIds,
  };
}
