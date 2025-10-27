"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useUser, useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Save, RefreshCcw } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminContentPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [about, setAbout] = useState({ title: "", text: "" });
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🧩 Cargar contenido desde Supabase
  async function fetchContent() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("site_content").select("*");
      if (error) throw error;

      console.log("✅ Data loaded:", data);

      const aboutData = data.find((x) => x.section === "about");
      const servicesData = data.find((x) => x.section === "services");

      setAbout(aboutData?.content || { title: "", text: "" });
      setServices(servicesData?.content?.items || []);
    } catch (err) {
      console.error("❌ Error loading content:", err.message);
      toast.error("Error loading content: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // 🧩 Ejecutar carga inicial + suscripción realtime
  useEffect(() => {
    // 🔹 1. Cargar contenido inicial
    fetchContent();

    // 🔹 2. Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel("site_content_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_content" },
        (payload) => {
          console.log("🔄 Realtime update detected:", payload);
          fetchContent(); // recargar al detectar cambios
        }
      )
      .subscribe();

    // cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 💾 Guardar cambios
  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/update-site-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ about, services }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save content");

      toast.success("✅ Content updated successfully!");
    } catch (err) {
      console.error("❌ Error saving changes:", err.message);
      toast.error("Error saving changes: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // ➕ Añadir servicio
  const addService = () =>
    setServices([...services, { title: "🧹 New Service", desc: "" }]);

  // ❌ Eliminar servicio
  const removeService = (i) =>
    setServices(services.filter((_, idx) => idx !== i));

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading content...
      </div>
    );

  // 🚫 Solo admins
  const role = user?.publicMetadata?.role || "user";
  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <h1 className="text-2xl font-semibold text-gray-700 mb-2">
          Access Denied
        </h1>
        <p className="text-gray-500">
          You need admin privileges to access this page.
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto bg-white p-8 rounded-2xl shadow"
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700">
            Website Content Manager
          </h1>
          <div className="flex gap-3">
            <button
              onClick={fetchContent}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
            >
              <RefreshCcw size={18} /> Refresh
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
            >
              <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* 🔹 ABOUT SECTION */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            About Section
          </h2>
          <input
            type="text"
            value={about.title}
            onChange={(e) => setAbout({ ...about, title: e.target.value })}
            className="w-full border rounded-lg p-3 mb-3 text-gray-700 font-semibold"
          />
          <textarea
            rows={5}
            value={about.text}
            onChange={(e) => setAbout({ ...about, text: e.target.value })}
            className="w-full border rounded-lg p-3 text-gray-700"
          />
        </section>

        {/* 🔹 SERVICES SECTION */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              Services Section
            </h2>
            <button
              onClick={addService}
              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              + Add Service
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((srv, i) => (
              <div
                key={i}
                className="border rounded-xl p-4 shadow-sm bg-gray-50 relative"
              >
                <button
                  onClick={() => removeService(i)}
                  className="absolute top-2 right-3 text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
                <input
                  type="text"
                  value={srv.title}
                  onChange={(e) => {
                    const updated = [...services];
                    updated[i].title = e.target.value;
                    setServices(updated);
                  }}
                  className="w-full border rounded-lg p-2 mb-2 text-gray-700 font-semibold"
                />
                <textarea
                  rows={4}
                  value={srv.desc}
                  onChange={(e) => {
                    const updated = [...services];
                    updated[i].desc = e.target.value;
                    setServices(updated);
                  }}
                  className="w-full border rounded-lg p-2 text-gray-700"
                />
              </div>
            ))}
          </div>
        </section>
      </motion.div>
    </main>
  );
}
