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
  const [serviceDetails, setServiceDetails] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🧩 Cargar contenido desde Supabase
  async function fetchContent() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("site_content").select("*");
      if (error) throw error;

      const aboutData = data.find((x) => x.section === "about");
      const servicesData = data.find((x) => x.section === "services");
      const serviceDetailsData = data.find(
        (x) => x.section === "service_details"
      );

      setAbout(aboutData?.content || { title: "", text: "" });
      setServices(servicesData?.content?.items || []);
      setServiceDetails(serviceDetailsData?.content?.items || []);
    } catch (err) {
      console.error(err);
      toast.error("Error loading content");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchContent();

    const channel = supabase
      .channel("site_content_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_content" },
        fetchContent
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // 💾 Guardar cambios — FIX DEFINITIVO (JWT)
  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          about,
          services,
          serviceDetails,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save content");

      toast.success("✅ Content updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error saving changes");
    } finally {
      setSaving(false);
    }
  }

  // ➕ Añadir landing service
  const addService = () =>
    setServices([...services, { title: "🧹 New Service", desc: "" }]);

  // ❌ Eliminar landing service
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
      <div className="flex items-center justify-center h-screen text-gray-500">
        Access denied
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto bg-white p-8 rounded-2xl shadow space-y-14"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-blue-700">
            Website Content Manager
          </h1>
          <div className="flex gap-3">
            <button
              onClick={fetchContent}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg"
            >
              <RefreshCcw size={16} /> Refresh
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              <Save size={16} /> {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* ABOUT */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">About</h2>
          <input
            className="w-full border rounded-lg p-3 mb-3"
            value={about.title}
            onChange={(e) => setAbout({ ...about, title: e.target.value })}
          />
          <textarea
            rows={5}
            className="w-full border rounded-lg p-3"
            value={about.text}
            onChange={(e) => setAbout({ ...about, text: e.target.value })}
          />
        </section>

        {/* LANDING SERVICES */}
        <section>
          <div className="flex justify-between mb-4">
            <h2 className="text-2xl font-semibold">Landing Services</h2>
            <button
              onClick={addService}
              className="px-3 py-1 bg-green-600 text-white rounded-lg"
            >
              + Add
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {services.map((srv, i) => (
              <div
                key={i}
                className="border rounded-xl p-4 bg-gray-50 relative"
              >
                <button
                  onClick={() => removeService(i)}
                  className="absolute top-2 right-3 text-red-500"
                >
                  ✕
                </button>
                <input
                  className="w-full border rounded p-2 mb-2"
                  value={srv.title}
                  onChange={(e) => {
                    const updated = [...services];
                    updated[i].title = e.target.value;
                    setServices(updated);
                  }}
                />
                <textarea
                  rows={3}
                  className="w-full border rounded p-2"
                  value={srv.desc}
                  onChange={(e) => {
                    const updated = [...services];
                    updated[i].desc = e.target.value;
                    setServices(updated);
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* SERVICE DETAILS */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Service Detail Pages</h2>

          <div className="space-y-10">
            {serviceDetails.map((srv, i) => (
              <div key={srv.slug} className="border rounded-xl p-6 bg-gray-50">
                <h3 className="font-bold mb-4">
                  {srv.title} ({srv.slug})
                </h3>

                <input
                  className="w-full border rounded p-2 mb-3"
                  value={srv.title}
                  onChange={(e) => {
                    const updated = [...serviceDetails];
                    updated[i].title = e.target.value;
                    setServiceDetails(updated);
                  }}
                />

                <textarea
                  className="w-full border rounded p-2 mb-3"
                  value={srv.description}
                  onChange={(e) => {
                    const updated = [...serviceDetails];
                    updated[i].description = e.target.value;
                    setServiceDetails(updated);
                  }}
                />

                <textarea
                  rows={6}
                  className="w-full border rounded p-2 mb-3"
                  value={srv.includes.join("\n")}
                  onChange={(e) => {
                    const updated = [...serviceDetails];
                    updated[i].includes = e.target.value
                      .split("\n")
                      .filter(Boolean);
                    setServiceDetails(updated);
                  }}
                />

                <textarea
                  className="w-full border rounded p-2"
                  value={srv.idealFor}
                  onChange={(e) => {
                    const updated = [...serviceDetails];
                    updated[i].idealFor = e.target.value;
                    setServiceDetails(updated);
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      </motion.div>
    </main>
  );
}
