"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignUpButton } from "@clerk/nextjs";
import { ArrowUp, Edit3, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function HomePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const [showTopBtn, setShowTopBtn] = useState(false);
  const [about, setAbout] = useState(null);
  const [services, setServices] = useState([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ Redirigir si entra a /sign-in o /sign-up logueado
  useEffect(() => {
    if (!isLoaded) return;
    const path = window.location.pathname;
    if (isSignedIn && ["/sign-in", "/sign-up"].includes(path)) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  // 🎯 Mostrar botón scroll-top
  useEffect(() => {
    const handleScroll = () => setShowTopBtn(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // 🧩 Cargar contenido desde Supabase
  async function fetchContent() {
    const { data, error } = await supabase.from("site_content").select("*");
    if (error) {
      toast.error("Error loading content");
      return;
    }
    const aboutData = data.find((x) => x.section === "about");
    const servicesData = data.find((x) => x.section === "services");
    setAbout(aboutData?.content);
    setServices(servicesData?.content?.items || []);
  }

  useEffect(() => {
    fetchContent();
  }, []);

  // 🔄 Escuchar cambios en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel("realtime:site_content")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_content" },
        () => fetchContent()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 💾 Guardar cambios
  async function saveContent() {
    try {
      setSaving(true);
      const res = await fetch("/api/update-site-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ about, services }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save content");

      toast.success("✅ Changes saved successfully!");
      setEditing(false);
    } catch (err) {
      console.error("❌ Error saving changes:", err.message);
      toast.error("Error saving changes: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!isLoaded)
    return (
      <main className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </main>
    );

  // 🏡 LANDING PAGE
  return (
    <main className="relative min-h-screen text-white overflow-x-hidden">
      {/* 🔹 HERO NUEVO — ULTRA LEGIBLE */}
      <section
        className="relative flex flex-col items-center justify-center h-screen text-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* 🔹 Overlay más oscuro y con degradado más suave */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/40 backdrop-blur-[2px]" />

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 px-6 max-w-3xl mx-auto"
        >
          {/* TÍTULO — más glow y más spacing */}
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]">
            Professional Cleaning
            <span className="block text-blue-300 drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]">
              For Homes & Rentals
            </span>
          </h1>

          {/* SUBTÍTULO — tamaño ligeramente mayor y mayor contraste */}
          <p className="text-lg md:text-2xl text-gray-100 mb-10 leading-relaxed max-w-2xl mx-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
            Fast, reliable and detailed cleaning for property managers,
            landlords, homeowners and renters across Moncton, Dieppe and
            Riverview.
          </p>

          {/* BOTONES — tamaño más balanceado y más shadows */}
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href="#services"
              className="px-7 py-3 bg-white text-blue-700 font-semibold rounded-full shadow-xl hover:shadow-2xl hover:bg-blue-50 transition"
            >
              View Services
            </a>

            <a
              href="#contact"
              className="px-7 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-xl hover:bg-blue-700 hover:shadow-2xl transition"
            >
              Get a Quote
            </a>
          </div>
        </motion.div>
      </section>

      {/* 🔹 About */}
      <section
        id="about"
        className="bg-white text-gray-800 py-24 px-6 md:px-16 lg:px-32 flex flex-col items-center text-center"
      >
        <motion.h2
          className="text-3xl font-bold mb-6 text-blue-600"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {about?.title || "About Our Service"}
        </motion.h2>

        {editing ? (
          <textarea
            value={about?.text || ""}
            onChange={(e) => {
              setAbout({ ...about, text: e.target.value });
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            className="max-w-3xl w-full text-lg text-gray-700 leading-relaxed resize-none overflow-hidden border p-3 rounded-lg border-gray-300 focus:outline-none transition-all"
          />
        ) : (
          <motion.p className="max-w-3xl w-full text-lg text-gray-600 leading-relaxed whitespace-pre-wrap">
            {about?.text ||
              "We specialize in professional cleaning and property maintenance services tailored for landlords, tenants, and property managers. Our mission is to simplify property management while enhancing the overall living experience."}
          </motion.p>
        )}

        {/* 🔒 Solo admins pueden editar */}
        {isSignedIn && user?.publicMetadata?.role === "admin" && (
          <div className="mt-6 flex gap-4">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Edit3 size={18} /> Edit Content
              </button>
            ) : (
              <>
                <button
                  onClick={saveContent}
                  disabled={saving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <Check size={18} /> {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition flex items-center gap-2"
                >
                  <X size={18} /> Cancel
                </button>
              </>
            )}
          </div>
        )}
      </section>

      {/* 🔹 Services */}
      <section
        id="services"
        className="bg-gray-50 py-20 text-gray-800 text-center px-6"
      >
        <h2 className="text-3xl font-bold mb-10 text-blue-600">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          {services.map((srv, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold mb-2">{srv.title}</h3>
              {editing ? (
                <textarea
                  value={srv.desc}
                  onChange={(e) => {
                    const updated = [...services];
                    updated[i].desc = e.target.value;
                    setServices(updated);
                  }}
                  className="w-full text-gray-600 border rounded-md p-2"
                />
              ) : (
                <p className="text-gray-600">{srv.desc}</p>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* 🔹 Join Our Team */}
      <section
        id="join"
        className="bg-blue-600 text-white py-24 px-6 md:px-16 lg:px-32 flex flex-col items-center text-center"
      >
        <motion.h2
          className="text-3xl font-bold mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          Join Our Team
        </motion.h2>
        <motion.p
          className="max-w-2xl text-lg text-blue-100 mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          Are you passionate about cleaning, organization, and providing
          exceptional service? Team Home Services is always looking for
          dedicated professionals to join our growing network. Become part of a
          supportive community where your work truly makes a difference.
        </motion.p>
        <motion.a
          href="/staff/apply"
          whileHover={{ scale: 1.05 }}
          className="px-8 py-3 bg-white text-blue-700 font-semibold rounded-lg shadow-lg hover:bg-blue-50 transition"
        >
          Apply Now
        </motion.a>
      </section>
      {/* 🔹 Contact */}
      <section
        id="contact"
        className="bg-white text-gray-800 py-24 px-6 md:px-16 lg:px-32 flex flex-col items-center text-center"
      >
        <motion.h2
          className="text-3xl font-bold mb-6 text-blue-600"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          Get in Touch
        </motion.h2>

        <motion.p
          className="max-w-2xl text-lg text-gray-600 mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          Have a question or need a custom quote? We’d love to hear from you.
          Fill out the form below or contact us directly — our team will respond
          as soon as possible.
        </motion.p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target;
            const formData = {
              name: form.name.value,
              email: form.email.value,
              message: form.message.value,
            };

            try {
              const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
              });

              if (!res.ok) throw new Error("Error sending message");
              toast.success("✅ Message sent successfully!");
              form.reset();
            } catch (err) {
              toast.error("❌ Failed to send message");
              console.error(err);
            }
          }}
          className="w-full max-w-lg flex flex-col gap-4 text-left"
        >
          <div>
            <label className="block mb-1 text-gray-700 font-medium">Name</label>
            <input
              type="text"
              name="name"
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700 font-medium">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@email.com"
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700 font-medium">
              Message
            </label>
            <textarea
              name="message"
              rows="4"
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write your message..."
            />
          </div>

          <button
            type="submit"
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
          >
            Send Message
          </button>
        </form>

        <div className="mt-10 text-gray-700">
          <p className="mb-2">
            📧 Email:{" "}
            <a
              href="mailto:info@teamhomeservices.ca"
              className="text-blue-600 hover:underline"
            >
              info@teamhomeservices.ca
            </a>
          </p>
          <p>
            📞 Phone: <span className="font-medium">506-588-8517</span>
          </p>
          <p className="mt-2">📍 Moncton, New Brunswick, Canada</p>
        </div>
      </section>

      {/* 🔹 Footer */}
      <footer className="bg-black text-white text-center py-6 text-sm">
        © {new Date().getFullYear()} Team Home Services. All rights reserved.
      </footer>

      {/* 🆙 Scroll to top */}
      <AnimatePresence>
        {showTopBtn && (
          <motion.button
            key="scrollTop"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.4 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition z-50"
          >
            <ArrowUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </main>
  );
}
