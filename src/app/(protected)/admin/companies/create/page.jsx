"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CreateCompanyPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
    };

    try {
      const res = await fetch("/api/companies/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // 🛡️ PROTECCIÓN CLAVE (evita <!DOCTYPE> crash)
      const contentType = res.headers.get("content-type");
      let json = {};

      if (contentType && contentType.includes("application/json")) {
        json = await res.json();
      }

      if (!res.ok) {
        console.error("CREATE COMPANY ERROR:", json);
        toast.error(json?.error || "Error creating company");
        return;
      }

      toast.success("Company created successfully!");
      router.push("/admin/companies");
    } catch (err) {
      console.error("REQUEST ERROR:", err);
      toast.error("Unexpected error creating company");
    }
  }

  return (
    <div className="mx-auto max-w-lg p-6 pt-[130px]">
      <h1 className="text-3xl font-semibold mb-6">Add New Company</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* NAME */}
        <div>
          <label className="block text-sm font-medium mb-1">Company Name</label>
          <input
            name="name"
            placeholder="ex: 4 Rent Solutions"
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
            placeholder="ex: info@company.com"
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
            placeholder="ex: (506) 555-1929"
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
            placeholder="Internal notes about the company"
            className="w-full border rounded p-2 h-24"
            value={form.notes}
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          className="w-full rounded bg-blue-600 py-2 text-white text-lg font-medium shadow-sm hover:bg-blue-700 transition"
        >
          Create Company
        </button>
      </form>
    </div>
  );
}
