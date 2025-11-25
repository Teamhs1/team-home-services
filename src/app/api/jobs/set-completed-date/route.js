import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { job_id, completed_at } = await req.json();

  const { error } = await supabase
    .from("cleaning_jobs")
    .update({ completed_at })
    .eq("id", job_id);

  if (error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
