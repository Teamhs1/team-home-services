"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2, Mail } from "lucide-react";
import MessagesTable from "./components/MessagesTable"; // 👈 tu nuevo componente moderno

export default function MessagesPage() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const token = await getToken({ template: "supabase" });
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          {
            global: { headers: { Authorization: `Bearer ${token}` } },
          }
        );

        const { data, error } = await supabase
          .from("contact_messages")

          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setMessages(data || []);
      } catch (err) {
        console.error("❌ Error loading messages:", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [getToken]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );

  return (
    <main className="max-w-5xl mx-auto px-6 pt-32 pb-10">
      {/* Título */}
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Contact Messages</h1>
      </div>

      {/* Tabla moderna */}
      <MessagesTable
        messages={messages}
        onSelect={(msg) => setSelectedMessage(msg)}
      />

      {/* Panel de detalle (si quieres lo hacemos luego) */}
      {selectedMessage && (
        <div className="mt-6 p-5 rounded-xl border shadow bg-white">
          <h2 className="text-xl font-semibold">{selectedMessage.name}</h2>
          <p className="text-sm text-gray-600">{selectedMessage.email}</p>

          <p className="mt-4 whitespace-pre-line text-gray-800">
            {selectedMessage.message}
          </p>

          <button
            onClick={() => setSelectedMessage(null)}
            className="mt-5 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      )}
    </main>
  );
}
