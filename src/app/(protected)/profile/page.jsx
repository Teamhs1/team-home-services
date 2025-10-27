"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Sincronizar datos cuando Clerk haya cargado completamente
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setName(user.fullName || "");
      setEmail(user.primaryEmailAddress?.emailAddress || "");
    }
  }, [isLoaded, isSignedIn, user]);

  // 🔹 Mostrar mensaje si Clerk aún no cargó
  if (!isLoaded) {
    return <div className="p-6 text-gray-500">Loading profile...</div>;
  }

  // 🔹 Mostrar aviso si no hay sesión
  if (!isSignedIn) {
    return (
      <div className="p-6 text-red-500">
        You must be signed in to view this page.
      </div>
    );
  }

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name }),
      });

      if (!res.ok) throw new Error("Update failed");

      toast.success("✅ Profile updated successfully!");
      await user.reload(); // 🔄 refresca datos desde Clerk
    } catch (err) {
      toast.error("❌ Error updating profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page space-y-6">
      <h1 className="heading flex items-center gap-2">👤 Profile</h1>

      <div className="card space-y-4">
        {/* Nombre */}
        <div>
          <label className="font-semibold text-gray-700 dark:text-gray-200 block mb-1">
            Name:
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        {/* Email */}
        <div>
          <p className="font-semibold text-gray-700 dark:text-gray-200">
            Email:
          </p>
          <p>{email || "Not available"}</p>
        </div>

        {/* Rol */}
        <div>
          <p className="font-semibold text-gray-700 dark:text-gray-200">
            Role:
          </p>
          {/* ✅ Acceso seguro a metadata */}
          <p>{user?.publicMetadata?.role || "user"}</p>
        </div>

        {/* Botón guardar */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-brand mt-4"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
