import { createClient } from "@supabase/supabase-js";

export async function POST(req, { params }) {
  try {
    const jobId = params.id;

    if (!jobId) {
      return new Response(JSON.stringify({ error: "Missing job id" }), {
        status: 400,
      });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // 🔐 SERVER ONLY
    );

    const { error } = await supabase
      .from("cleaning_jobs")
      .update({
        status: "pending",
        completed_at: null,
      })
      .eq("id", jobId);

    if (error) {
      console.error("❌ Supabase reopen error:", error);

      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    // ✅ ESTO HACE QUE res.ok === true
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("❌ Reopen exception:", err);

    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
    });
  }
}
