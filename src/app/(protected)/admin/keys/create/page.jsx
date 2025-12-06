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
    floor: "",
    type: "",
    tag_code: "",
    status: "available",
  });

  // ============================
  // Load properties from Supabase
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

    console.log("PROPERTIES RESULT:", data, error);

    if (error) {
      console.error("Supabase SELECT error:", error);
      toast.error("Error loading properties");
      return;
    }

    setProperties(data);
  }

  // ============================
  // Update form fields
  // ============================
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // ============================
  // Generate tag_code automatically
  // ============================
  function generateTagCode() {
    const property = properties.find(p => p.id === form.property_id);
    if (!property) return "";

    const cleanName = property.name.replace(/\s+/g, "");
    const unit = form.unit ? `-U${form.unit}` : "";
    const type = form.type.toUpperCase();

    return `${cleanName}${unit}-${type}`;
  }

  // ============================
  // SUBMIT
  // ============================
  async function handleSubmit(e) {
    e.preventDefault();

    const finalTagCode = generateTagCode();
    console.log("FINAL TAG CODE:", finalTagCode);

    const payload = {
      property_id: form.property_id,
      unit: form.unit,
      floor: form.floor,
      type: form.type,
      tag_code: finalTagCode,
      status: "available",
    };

    console.log("PAYLOAD:", payload);

    const { error } = await supabase.from("keys").insert([payload]);

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
      toast.error("Error inserting key");
      return;
    }

    toast.success("Key created successfully!");
    router.push("/keys");
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

          {/* DEBUG */}
          {properties.length === 0 && <option disabled>No properties found</option>}

          {properties.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* UNIT */}
        <input
          name="unit"
          placeholder="Unit (ex: 2)"
          className="w-full border p-2"
          value={form.unit}
          onChange={handleChange}
        />

        {/* FLOOR */}
        <input
          name="floor"
          placeholder="Floor"
          className="w-full border p-2"
          value={form.floor}
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
          <option value="FD">Front Door</option>
          <option value="MBX">Mailbox</option>
          <option value="STG">Storage</option>
          <option value="LDR">Laundry</option>
          <option value="ELEC">Electrical Room</option>
          <option value="MECH">Mechanical Room</option>
          <option value="MSTR">Master Key</option>
        </select>

        {/* PREVIEW TAG */}
        <div className="rounded border bg-gray-50 p-3 text-gray-700">
          <strong>Tag Code Preview:</strong> {generateTagCode() || "Select property, unit & type"}
        </div>

        <button className="w-full rounded bg-blue-600 px-4 py-2 text-white" type="submit">
          Add Key
        </button>
      </form>
    </div>
  );
}
