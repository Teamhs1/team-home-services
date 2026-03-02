"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import CompanySection from "@/components/company/CompanySection";

export default function CreateWorkspacePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/companies/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });

      let data = {};

      const contentType = res.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      }

      if (!res.ok) {
        toast.error(data?.error || "Error creating workspace");
        setLoading(false);
        return;
      }

      toast.success("Workspace created successfully!");

      // 🔥 Redirige al dashboard normal
      router.push("/dashboard/company");
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error creating workspace");
      setLoading(false);
    }
  }

  return (
    <CompanySection>
      <div className="max-w-xl mt-10">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create Your Workspace
        </h1>

        <p className="text-muted-foreground mt-2">
          A workspace is required before selecting a subscription plan.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              Company Name
            </label>
            <input
              name="name"
              className="w-full border rounded p-2"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Email (optional)
            </label>
            <input
              name="email"
              className="w-full border rounded p-2"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Phone (optional)
            </label>
            <input
              name="phone"
              className="w-full border rounded p-2"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Notes (optional)
            </label>
            <textarea
              name="notes"
              className="w-full border rounded p-2 h-24"
              value={form.notes}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-black py-2 text-white text-lg font-medium hover:opacity-90 transition"
          >
            {loading ? "Creating..." : "Create Workspace"}
          </button>
        </form>
      </div>
    </CompanySection>
  );
}
