"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/supabaseClient";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

export default function EditCompanyPage() {
  const router = useRouter();
  const { id } = useParams(); // Company ID from URL

  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  // Load company data
  useEffect(() => {
    async function loadCompany() {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("LOAD ERROR:", error);
        toast.error("Error loading company");
        return;
      }

      setForm({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        notes: data.notes || "",
      });

      setLoading(false);
    }

    loadCompany();
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
    };

    const { error } = await supabase
      .from("companies")
      .update(payload)
      .eq("id", id);

    if (error) {
      console.error("UPDATE ERROR:", error);
      toast.error("Error updating company");
      return;
    }

    toast.success("Company updated successfully!");
    router.push("/admin/companies");
  }

  if (loading) {
    return (
      <div className="p-10 text-center pt-[130px] text-gray-500">
        Loading company...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg p-6 pt-[130px]">
      <h1 className="text-3xl font-semibold mb-6">Edit Company</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* COMPANY NAME */}
        <div>
          <label className="block text-sm font-medium mb-1">Company Name</label>
          <input
            name="name"
            className="w-full border rounded p-2"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        {/* EMAIL */}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            name="email"
            className="w-full border rounded p-2"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        {/* PHONE */}
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            name="phone"
            className="w-full border rounded p-2"
            value={form.phone}
            onChange={handleChange}
          />
        </div>

        {/* NOTES */}
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            name="notes"
            className="w-full border rounded p-2 h-24"
            value={form.notes}
            onChange={handleChange}
          />
        </div>

        {/* SAVE BUTTON */}
        <button
          type="submit"
          className="w-full rounded bg-blue-600 py-2 text-white text-lg font-medium shadow-sm hover:bg-blue-700 transition"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
