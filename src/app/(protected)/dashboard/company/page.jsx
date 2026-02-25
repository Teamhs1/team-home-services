"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import CompanySection from "@/components/company/CompanySection";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";

export default function CompanyPage() {
  const { getToken } = useAuth();

  const [propertyCount, setPropertyCount] = useState("—");
  const [memberCount, setMemberCount] = useState("—");
  const [logo, setLogo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [createdAt, setCreatedAt] = useState(null);
  /* =========================
     LOAD OVERVIEW FROM API
  ========================= */
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const res = await fetch("/api/company/overview", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          console.error(data.error);
          return;
        }

        if (mounted) {
          setCompanyId(data.company_id);
          setCompanyName(data.company_name);
          setCreatedAt(data.created_at);
          setMemberCount(data.members);
          setPropertyCount(data.properties);
          setLogo(data.logo);
        }
      } catch (err) {
        console.error("COMPANY INIT ERROR:", err);
        if (mounted) {
          setPropertyCount(0);
          setMemberCount(0);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================
     UPLOAD LOGO (SIN CAMBIOS)
  ========================= */
  async function uploadLogo(file) {
    try {
      if (!companyId) return;

      setUploading(true);

      const token = await getToken({ template: "supabase" });

      const supabase = createClient(
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

      const fileExt = file.name.split(".").pop();
      const fileName = `${companyId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("company-logos")
        .getPublicUrl(fileName);

      const logoUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from("companies")
        .update({ logo_url: logoUrl })
        .eq("id", companyId);

      if (updateError) throw updateError;

      setLogo(logoUrl);
    } catch (err) {
      console.error("UPLOAD LOGO ERROR:", err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <CompanySection>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {companyName || "Company Overview"}
        </h1>

        {createdAt && (
          <p className="text-sm text-muted-foreground mt-1">
            Created on {new Date(createdAt).toLocaleDateString("en-CA")}
          </p>
        )}

        <p className="text-muted-foreground mt-2">
          Manage company information and settings.
        </p>
      </div>

      {/* Logo */}
      <div className="mt-8 flex items-center gap-6">
        {logo ? (
          <Image
            src={logo}
            alt="Company Logo"
            width={140}
            height={140}
            className="rounded-xl border object-contain bg-white p-2"
          />
        ) : (
          <div className="w-[140px] h-[140px] rounded-xl border flex items-center justify-center text-sm text-muted-foreground">
            No Logo
          </div>
        )}

        <label className="cursor-pointer text-sm font-medium">
          {uploading ? "Uploading..." : "Upload Logo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                uploadLogo(e.target.files[0]);
              }
            }}
          />
        </label>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 mt-10">
        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Members</p>
          <p className="text-2xl font-semibold mt-1">{memberCount}</p>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Properties</p>
          <p className="text-2xl font-semibold mt-1">{propertyCount}</p>
        </div>
      </div>
    </CompanySection>
  );
}
