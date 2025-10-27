"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ProfileDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 🔹 Cargar perfil
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id, clerk_id, full_name, email, avatar_url, role, status, phone, created_at, updated_at"
          )
          .eq("id", id)
          .single();
        if (error) throw error;
        setProfile(data);
      } catch (err) {
        console.error("❌ Error fetching profile:", err.message);
        toast.error("Error loading profile");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

  // 🔄 Subir avatar a Supabase Storage
  const handleAvatarUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", id);

      const res = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProfile((prev) => ({ ...prev, avatar_url: data.url }));
      toast.success("✅ Avatar updated successfully!");
    } catch (err) {
      console.error("❌ Avatar upload failed:", err.message);
      toast.error("Error uploading avatar: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // 💾 Guardar cambios
  const handleSave = async () => {
    try {
      setSaving(true);

      const res = await fetch("/api/admin/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ muy importante: envía la sesión de Clerk
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

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("✅ Profile updated!");
    } catch (err) {
      toast.error("Failed to update profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Loading profile...
      </div>
    );

  if (!profile)
    return (
      <div className="p-6 text-center text-gray-500">
        <p>User not found.</p>
        <button
          onClick={() => router.push("/admin/users")}
          className="mt-3 text-blue-600 hover:underline"
        >
          ← Back to users
        </button>
      </div>
    );

  return (
    <div className="p-6">
      {/* 🔹 Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-blue-600 transition"
          >
            <ArrowLeft size={20} className="mr-1" /> Back
          </button>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Loader2 className="animate-spin" size={16} />}
          Save Changes
        </button>
      </div>

      {/* 🔹 Perfil */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            <Image
              src={
                profile.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  profile.full_name || "User"
                )}&background=random&color=fff`
              }
              alt={profile.full_name || "User"}
              width={100}
              height={100}
              className="rounded-full border border-gray-300 dark:border-gray-700 object-cover"
            />
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 transition"
              title="Upload new avatar"
            >
              {uploading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Upload size={16} />
              )}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          <div className="flex-1 w-full">
            <label className="block text-sm text-gray-500 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={profile.full_name || ""}
              onChange={(e) =>
                setProfile({ ...profile, full_name: e.target.value })
              }
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 mb-3 bg-white dark:bg-gray-900"
            />

            <label className="block text-sm text-gray-500 mb-1">Email</label>
            <input
              type="text"
              value={profile.email || ""}
              disabled
              className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 mb-3 text-gray-500"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Role</label>
                <select
                  value={profile.role || "client"}
                  onChange={(e) =>
                    setProfile({ ...profile, role: e.target.value })
                  }
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2"
                >
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="client">Client</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  Status
                </label>
                <select
                  value={profile.status || "active"}
                  onChange={(e) =>
                    setProfile({ ...profile, status: e.target.value })
                  }
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <label className="block text-sm text-gray-500 mt-4 mb-1">
              Phone
            </label>
            <input
              type="text"
              value={profile.phone || ""}
              onChange={(e) =>
                setProfile({ ...profile, phone: e.target.value })
              }
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
