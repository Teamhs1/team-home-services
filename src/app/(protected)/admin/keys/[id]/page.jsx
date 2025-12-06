"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import QRCode from "react-qr-code";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function KeyPage() {
  const params = useParams();
  const identifier = params?.id;

  const { getToken } = useAuth();

  const [keyData, setKeyData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchKey() {
    try {
      const token = await getToken({ template: "supabase" });

      // ✅ Cliente supabase v2 con header del token
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );

      console.log("🔍 Searching key:", identifier);

      // 1️⃣ Buscar por TAG_CODE
      let { data, error } = await supabase
        .from("keys")
        .select("*")
        .eq("tag_code", identifier)
        .maybeSingle();

      // 2️⃣ Si no existe, buscar por ID
      if (!data) {
        console.log("🔄 Not found by tag_code, checking UUID...");
        const uuidQuery = await supabase
          .from("keys")
          .select("*")
          .eq("id", identifier)
          .maybeSingle();

        data = uuidQuery.data;
        error = uuidQuery.error;
      }

      console.log("📥 Supabase response:", { data, error });

      if (!data) {
        setKeyData(null);
        setLoading(false);
        return;
      }

      setKeyData(data);
      setLoading(false);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (identifier) fetchKey();
  }, [identifier]);

  if (loading) return <div className="p-6">Loading key...</div>;

  if (!keyData)
    return <div className="p-6 text-red-600">Key not found: {identifier}</div>;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-3xl font-bold">Key: {keyData.tag_code}</h1>

      <div className="mb-6 inline-block rounded bg-white p-4 shadow">
        <QRCode
          value={`https://teamhomeservices.ca/admin/keys/${keyData.tag_code}`}
          size={180}
        />
      </div>

      <div className="mb-6 text-lg">
        <p>
          <strong>Property:</strong> {keyData.property_address}
        </p>
        <p>
          <strong>Unit:</strong> {keyData.unit || "N/A"}
        </p>
        <p>
          <strong>Building:</strong> {keyData.building || "N/A"}
        </p>
        <p>
          <strong>Type:</strong> {keyData.type}
        </p>
        <p>
          <strong>Status:</strong> {keyData.status}
        </p>
      </div>
    </div>
  );
}
