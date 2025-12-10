"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase/supabaseClient";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CreatePropertyPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    street_number: "",
    street_name: "",
    unit: "",
    management_company: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function buildAddress() {
    const num = form.street_number.trim();
    const name = form.street_name.trim();
    const unit = form.unit.trim();

    if (!num || !name) return "";
    return unit ? `${num} ${name} Unit ${unit}` : `${num} ${name}`;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const address = buildAddress();

    if (!address) {
      toast.error("Please fill street number and street name");
      return;
    }

    const payload = {
      street_number: form.street_number.trim(),
      street_name: form.street_name.trim(),
      unit: form.unit.trim() || null,
      name: address,
      address: address,
      management_company: form.management_company.trim() || null,
    };

    console.log("PAYLOAD SENT:", payload);

    const { error } = await supabase.from("properties").insert([payload]);

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
      toast.error("Error inserting property");
      return;
    }

    toast.success("Property created successfully!");
    router.push("/admin/properties");
  }

  return (
    <div className="mx-auto max-w-lg p-6 pt-[130px]">
      {/* 👆 Empuja el contenido debajo del navbar */}

      <h1 className="mb-6 text-3xl font-semibold tracking-tight">
        Add New Property
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* STREET NUMBER */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Street Number
          </label>
          <input
            name="street_number"
            placeholder="ex: 31"
            className="w-full border rounded p-2"
            value={form.street_number}
            onChange={handleChange}
            required
          />
        </div>

        {/* STREET NAME */}
        <div>
          <label className="block text-sm font-medium mb-1">Street Name</label>
          <input
            name="street_name"
            placeholder="ex: McKenzie"
            className="w-full border rounded p-2"
            value={form.street_name}
            onChange={handleChange}
            required
          />
        </div>

        {/* UNIT */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Unit <span className="text-gray-500">(optional)</span>
          </label>
          <input
            name="unit"
            placeholder="ex: 1A"
            className="w-full border rounded p-2"
            value={form.unit}
            onChange={handleChange}
          />
        </div>

        {/* MANAGEMENT COMPANY */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Property Management Company
          </label>
          <input
            name="management_company"
            placeholder="ex: 4Rent Solutions"
            className="w-full border rounded p-2"
            value={form.management_company}
            onChange={handleChange}
          />
        </div>

        {/* PREVIEW */}
        <div className="rounded border bg-gray-50 p-4 text-gray-700">
          <strong className="block mb-1">Preview Address</strong>
          <span className="text-lg font-medium">
            {buildAddress() || "Waiting for address..."}
          </span>
        </div>

        <button
          type="submit"
          className="w-full rounded bg-blue-600 py-2 text-white text-lg font-medium shadow-sm hover:bg-blue-700 transition"
        >
          Add Property
        </button>
      </form>
    </div>
  );
}
