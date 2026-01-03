import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  const { tag, note } = await req.json();

  await supabase
    .from("keys")
    .update({ is_reported: true, report_note: note })
    .eq("tag_code", tag);

  return Response.json({ success: true });
}
