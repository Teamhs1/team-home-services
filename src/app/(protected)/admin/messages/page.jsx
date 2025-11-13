"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2, Mail } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function MessagesPage() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

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
        console.error("Error loading messages:", err.message);
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, [getToken]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );

  return (
    <main className="max-w-4xl mx-auto p-6 pt-36">
      <Card className="border border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Contact Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center py-10">
              No messages found.
            </p>
          ) : (
            <ul className="divide-y">
              {messages.map((msg) => (
                <li key={msg.id} className="py-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">{msg.name}</p>
                      <p className="text-sm text-gray-600">{msg.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-700 whitespace-pre-line">
                    {msg.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
