"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { CheckCircle, Send } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function StaffApplyPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    experience: "",
    availability: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // 🧾 Guardar solicitud en Supabase
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("staff_applications").insert([
        {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          experience: form.experience.trim(),
          availability: form.availability.trim(),
          message: form.message.trim(),
        },
      ]);

      if (error) throw error;
      toast.success("✅ Application submitted successfully!");
      setSubmitted(true);
      setForm({
        full_name: "",
        email: "",
        phone: "",
        experience: "",
        availability: "",
        message: "",
      });
    } catch (err) {
      console.error("❌ Error submitting form:", err.message);
      toast.error("Error submitting form: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-6">
        <CheckCircle className="text-green-600 w-20 h-20 mb-4" />
        <h1 className="text-3xl font-semibold mb-2 text-gray-800">
          Application Sent!
        </h1>
        <p className="text-gray-600 max-w-md">
          Thank you for applying to join <strong>Team Home Services</strong>.
          Our hiring team will review your application and reach out soon.
        </p>
        <a
          href="/"
          className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition"
        >
          Back to Home
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8"
      >
        <h1 className="text-3xl font-bold text-blue-600 mb-2 text-center">
          Join Our Team
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Fill out the form below to apply as part of our cleaning and property
          maintenance team.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">
              Experience (optional)
            </label>
            <textarea
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: e.target.value })}
              rows={3}
              placeholder="Tell us about your previous experience..."
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">
              Availability (days/hours)
            </label>
            <input
              type="text"
              value={form.availability}
              onChange={(e) =>
                setForm({ ...form, availability: e.target.value })
              }
              required
              placeholder="e.g. Weekdays 9am - 5pm"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">
              Additional Message (optional)
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={3}
              placeholder="Anything else you'd like to share?"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.03 }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit Application"}
            {!loading && <Send size={18} />}
          </motion.button>
        </form>
      </motion.div>
    </main>
  );
}
