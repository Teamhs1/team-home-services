import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, email, phone, role") // ✅ EMAIL AQUÍ
    .eq("clerk_id", userId)
    .single();

  if (error) {
    return new Response("Profile not found", { status: 404 });
  }

  return Response.json(data);
}
