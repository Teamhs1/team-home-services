import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, message } = body;

    if (!name || !email || !message)
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
      });

    const { error } = await supabase
      .from("contact_messages")
      .insert([{ name, email, message }]);

    if (error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });

    return new Response(
      JSON.stringify({ success: true, message: "Message received" }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error:", err.message);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}
