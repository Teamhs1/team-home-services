"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";

export default function EditCompanyPage() {
  const router = useRouter();
  const { id } = useParams();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [logo, setLogo] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  /* =====================
     CREATE AUTH CLIENT
  ===================== */
  async function getSupabase() {
    const token = await getToken({ template: "supabase" });

    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    );
  }

  /* =====================
     LOAD COMPANY
  ===================== */
  useEffect(() => {
    async function loadCompany() {
      const supabase = await getSupabase();

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

      setLogo(data.logo_url || null);
      setLoading(false);
    }

    if (id) loadCompany();
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  /* =====================
     UPLOAD LOGO
  ===================== */
  async function handleLogoUpload(file) {
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("companyId", id);

      const res = await fetch("/api/admin/upload-company-logo", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error);
      }

      setLogo(json.logoUrl);
      toast.success("Logo updated successfully!");
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      toast.error("Error uploading logo");
    } finally {
      setUploading(false);
    }
  }

  /* =====================
     SAVE COMPANY INFO
  ===================== */
  async function handleSubmit(e) {
    e.preventDefault();
    const supabase = await getSupabase();

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

    router.replace(`/admin/companies/${id}`);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="p-10 text-center pt-[130px] text-gray-500">
        Loading company...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg p-6 pt-[130px] space-y-8">
      <h1 className="text-3xl font-semibold">Edit Company</h1>

      {/* LOGO */}
      <div className="space-y-3">
        <label className="block text-sm font-medium">Company Logo</label>

        <div className="flex items-center gap-5">
          {logo ? (
            <Image
              src={logo}
              alt="Company Logo"
              width={120}
              height={120}
              className="rounded-xl border object-contain bg-white p-2"
            />
          ) : (
            <div className="w-[120px] h-[120px] rounded-xl border flex items-center justify-center text-lg font-bold bg-gray-100">
              {form.name?.charAt(0).toUpperCase()}
            </div>
          )}

          <label className="cursor-pointer text-sm font-medium text-blue-600 hover:underline">
            {uploading ? "Uploading..." : "Change Logo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleLogoUpload(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          name="name"
          className="w-full border rounded p-2"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          name="email"
          className="w-full border rounded p-2"
          value={form.email}
          onChange={handleChange}
        />
        <input
          name="phone"
          className="w-full border rounded p-2"
          value={form.phone}
          onChange={handleChange}
        />
        <textarea
          name="notes"
          className="w-full border rounded p-2 h-24"
          value={form.notes}
          onChange={handleChange}
        />

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
