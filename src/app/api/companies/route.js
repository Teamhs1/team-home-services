import { supabase } from "@/utils/supabase/supabaseClient";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("companies")
      .select(
        `
        id,
        name,
        email,
        phone,
        created_at,
        properties:properties(count),
        users:profiles!profiles_company_id_fkey(count)
      `
      )
      .order("name", { ascending: true });

    if (error) {
      console.error("API ERROR:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
