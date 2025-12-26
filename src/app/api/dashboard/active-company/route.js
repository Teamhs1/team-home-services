import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req) {
  const { company_id } = await req.json();
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // 🔒 validar que el user pertenece a esa company
  const { data: membership } = await supabase
    .from("company_members")
    .select("id")
    .eq("company_id", company_id)
    .single();

  if (!membership) {
    return new Response(JSON.stringify({ error: "Not allowed" }), {
      status: 403,
    });
  }

  // ✅ set active company
  await supabase
    .from("profiles")
    .update({ active_company_id: company_id })
    .eq("id", (await supabase.auth.getUser()).data.user.id);

  return Response.json({ success: true });
}
