"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProfileDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { getToken } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ======================
     LOAD PROFILE (ADMIN SAFE)
  ====================== */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        const token = await getToken({ template: "supabase" });
        if (!token) throw new Error("Missing auth token");

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

        const { data, error } = await supabase
          .from("profiles")
          .select(
            `
            id,
            clerk_id,
            full_name,
            email,
            avatar_url,
            role,
            status,
            phone,
            created_at,
            updated_at
          `
          )
          .eq("id", id)
          .maybeSingle(); // 👈 evita crash

        if (error) throw error;

        if (!data) {
          toast.error("Profile not found");
          setProfile(null);
          return;
        }

        setProfile(data);
      } catch (err) {
        console.error("❌ Error fetching profile:", err.message);
        toast.error("Error loading profile");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProfile();
  }, [id, getToken]);

  /* ======================
     SAVE PROFILE
  ====================== */
  const handleSave = async () => {
    try {
      setSaving(true);

      const res = await fetch("/api/admin/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          updates: {
            full_name: profile.full_name,
            role: profile.role,
            status: profile.status,
            phone: profile.phone,
            updated_at: new Date().toISOString(),
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Profile updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  /* ======================
     UI STATES
  ====================== */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        <Loader2 className="animate-spin mr-2" />
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-center text-gray-500">Profile not found.</div>
    );
  }

  return (
    <div className="pt-24 px-6 pb-10 max-w-3xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-blue-600"
        >
          <ArrowLeft size={18} className="mr-1" /> Back
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* CARD */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex gap-6 items-start">
          {/* Avatar */}
          <Image
            src={
              profile.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                profile.full_name || "User"
              )}`
            }
            alt={profile.full_name || "User"}
            width={96}
            height={96}
            className="rounded-full border"
          />

          {/* Fields */}
          <div className="flex-1 space-y-4">
            {/* Full name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Full name
              </label>
              <input
                value={profile.full_name || ""}
                onChange={(e) =>
                  setProfile({ ...profile, full_name: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                value={profile.email || ""}
                disabled
                className="w-full border rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={profile.role}
                onChange={(e) =>
                  setProfile({ ...profile, role: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="client">Client</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={profile.status || "active"}
                onChange={(e) =>
                  setProfile({ ...profile, status: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
