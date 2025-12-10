"use client";
console.log("🔴 CLIENT COMPONENT LOADED 🔥");

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/supabaseClient";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CreateKeyPage() {
  const router = useRouter();

  const [properties, setProperties] = useState([]);

  const [form, setForm] = useState({
    property_id: "",
    unit: "",
    type: "",
    status: "available",
  });

  // ============================
  // Load properties
  // ============================
  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    console.log("Fetching properties...");

    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Supabase SELECT error:", error);
      toast.error("Error loading properties");
      return;
    }

    // Remove duplicates by name
    const unique = [];
    const names = new Set();

    data.forEach((p) => {
      if (!names.has(p.name)) {
        names.add(p.name);
        unique.push(p);
      }
    });

    setProperties(unique);
  }

  // ============================
  // Update form fields
  // ============================
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // ============================
  // Safe Tag Code Generator
  // ============================
  function generateTagCode() {
    const property = properties.find((p) => p.id === form.property_id);
    if (!property) return "";

    // Clean property name (remove accents, spaces, symbols)
    const cleanName = property.name.replace(/[^a-zA-Z0-9]/g, "");

    const unit = form.unit ? `-U${form.unit}` : "";
    const typePart = form.type.toUpperCase();

    return `${cleanName}${unit}-${typePart}`;
  }

  // ============================
  // SUBMIT (FINAL VERSION)
  // ============================
  async function handleSubmit(e) {
    e.preventDefault();

    const finalTagCode = generateTagCode();

    console.log("FINAL TAG CODE:", finalTagCode);

    if (!form.property_id) return toast.error("Select a property");
    if (!form.type) return toast.error("Select a key type");

    if (form.unit && isNaN(Number(form.unit))) {
      return toast.error("Unit must be a number");
    }

    const payload = {
      property_id: form.property_id,
      unit: form.unit ? Number(form.unit) : null,
      type: form.type,
      tag_code: finalTagCode,
      status: "available",
    };

    console.log("PAYLOAD SENT:", payload);

    const { error } = await supabase.from("keys").insert([payload]);

    if (error) {
      console.error("SUPABASE INSERT ERROR:", JSON.stringify(error, null, 2));
      toast.error("Error inserting key");
      return;
    }

    toast.success("Key created successfully!");
    router.push("/admin/keys");
  }

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-4 text-2xl font-bold">Add New Key</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SELECT PROPERTY */}
        <select
          name="property_id"
          className="w-full border p-2"
          value={form.property_id}
          onChange={handleChange}
          required
        >
          <option value="">Select property</option>

          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* UNIT */}
        <input
          name="unit"
          placeholder="Unit (ex: 101)"
          className="w-full border p-2"
          value={form.unit}
          onChange={handleChange}
        />

        {/* TYPE */}
        <select
          name="type"
          className="w-full border p-2"
          value={form.type}
          onChange={handleChange}
          required
        >
          <option value="">Select key type</option>
          <option value="master">Master Key</option>
          <option value="mail">Mailbox</option>
          <option value="electrical">Electrical Room</option>
          <option value="mechanical">Mechanical Room</option>
          <option value="laundry">Laundry</option>
          <option value="storage">Storage</option>
          <option value="frontdoor">Front Door</option>
        </select>

        {/* TAG PREVIEW */}
        <div className="rounded border bg-gray-50 p-3 text-gray-700">
          <strong>Tag Code Preview:</strong>{" "}
          {generateTagCode() || "Select property, unit & type"}
        </div>

        <button
          className="w-full rounded bg-blue-600 px-4 py-2 text-white"
          type="submit"
        >
          Add Key
        </button>
      </form>
    </div>
  );
}
