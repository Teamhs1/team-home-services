"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { Loader2, Camera } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const fileRef = useRef(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  /* ======================
     LOAD USER (CLERK)
  ====================== */
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    let cancelled = false;

    async function loadProfile() {
      try {
        const res = await fetch("/api/profile", {
          method: "GET",
          credentials: "include", // 🔥 CLAVE
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to load profile");

        const data = await res.json();

        if (!cancelled) {
          setName(data.full_name || "");
          setEmail(data.email || "");
          setPhone(data.phone || "");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile");
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, user?.id]);

  /* ======================
     GUARDS
  ====================== */
  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-64 pt-[130px] text-gray-500">
        <Loader2 className="animate-spin mr-2" />
        Loading profile...
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="p-6 pt-[130px] text-red-500">
        You must be signed in to view this page.
      </div>
    );
  }

  /* ======================
     SAVE PROFILE
     (Clerk name + Supabase profile)
  ====================== */
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name,
          phone,
        }),
      });

      if (!res.ok) throw new Error("Update failed");

      toast.success("Profile updated");

      // 🔁 refresca datos Clerk (nombre)
      await user.reload();
    } catch (err) {
      console.error(err);
      toast.error("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  /* ======================
     AVATAR (CLERK)
  ====================== */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      await user.setProfileImage({ file });
      toast.success("Avatar updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  /* ======================
     UI
  ====================== */
  return (
    <div className="pt-24 px-6 pb-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        👤 My Profile
      </h1>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          {/* AVATAR */}
          <div className="relative">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative w-24 h-24 rounded-full overflow-hidden border focus:outline-none"
            >
              <Image
                src={
                  user.imageUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    name || "User"
                  )}&background=2563eb&color=fff`
                }
                alt={name}
                fill
                className="object-cover"
                sizes="96px"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                {uploadingAvatar ? (
                  <Loader2 className="animate-spin text-white" size={20} />
                ) : (
                  <Camera className="text-white" size={20} />
                )}
              </div>
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* INFO */}
          <div className="flex-1 w-full space-y-4">
            {/* NAME */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="text"
                value={email}
                disabled
                className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            {/* PHONE */}
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (506) 555-1234"
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            {/* ROLE */}
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                {user?.publicMetadata?.role || "user"}
              </span>
            </div>

            {/* ACTION */}
            <div className="pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="animate-spin" size={16} />}
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
