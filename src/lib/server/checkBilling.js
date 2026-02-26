export async function checkBillingForCompany(supabase, companyId) {
  if (!companyId) {
    return {
      ok: false,
      status: 400,
      error: "Missing company id",
    };
  }

  const { data: company, error } = await supabase
    .from("companies")
    .select("billing_enabled")
    .eq("id", companyId)
    .single();

  if (error || !company) {
    return {
      ok: false,
      status: 404,
      error: "Company not found",
    };
  }

  if (!company.billing_enabled) {
    return {
      ok: false,
      status: 403,
      error: "Billing is disabled for this company",
    };
  }

  return { ok: true };
}
