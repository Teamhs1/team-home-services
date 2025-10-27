import { Webhook } from "svix";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const payload = await req.text();
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("❌ Falta CLERK_WEBHOOK_SECRET en .env.local");
    return new Response("Server misconfigured", { status: 500 });
  }

  const wh = new Webhook(webhookSecret);
  let evt;

  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("❌ Error verificando firma del webhook:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const { type, data } = evt;

  if (!["user.created", "user.updated"].includes(type)) {
    console.log(`ℹ️ Ignorando evento no relevante: ${type}`);
    return new Response("Ignored", { status: 200 });
  }

  try {
    const email = data.email_addresses?.[0]?.email_address || null;
    const full_name = `${data.first_name || ""} ${data.last_name || ""}`.trim();
    const avatar_url = data.image_url || null;
    const role = data.public_metadata?.role || "client";

    if (!email) {
      console.warn("⚠️ Evento sin email válido, omitido:", data.id);
      return new Response("Missing email", { status: 400 });
    }

    // 🔹 Crea o actualiza el perfil en Supabase
    const { error } = await supabase.from("profiles").upsert(
      {
        clerk_id: data.id,
        email,
        full_name,
        avatar_url,
        role,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "clerk_id" }
    );

    if (error) {
      console.error("❌ Error guardando en Supabase:", error.message);
      return new Response("Database error", { status: 500 });
    }

    console.log(`✅ Usuario sincronizado: ${email} (${role})`);
    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("❌ Error procesando evento Clerk:", err);
    return new Response("Internal error", { status: 500 });
  }
}
