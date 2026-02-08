"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { Loader2, RefreshCcw, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

async function getSupabase(getToken) {
  const token = await getToken({ template: "supabase" });

  return createClient(
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
}

export default function ArchivedUsersPage() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const currentRole = user?.publicMetadata?.role || "client";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);

  // 🔹 Fetch archived users
  const fetchArchivedUsers = async () => {
    try {
      setLoading(true);

      const supabase = await getSupabase(getToken);

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
          deleted_at,
          created_at
        `,
        )
        .eq("status", "inactive")
        .order("deleted_at", { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load archived users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedUsers();
  }, []);

  // 🔄 Reactivate user
  const handleReactivate = async (profileId) => {
    const confirmed = window.confirm(
      "Reactivate this user?\n\nThey will regain access to the system.",
    );

    if (!confirmed) return;

    try {
      setChanging(true);

      const res = await fetch("/api/admin/reactivate-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("User reactivated");
      await fetchArchivedUsers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setChanging(false);
    }
  };

  // 💀 Hard delete (placeholder controlado)
  const handlePermanentDelete = async (user) => {
    const confirmed = window.confirm(
      `PERMANENT DELETE\n\n${user.full_name || user.email}\n\nThis cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setChanging(true);

      const res = await fetch("/api/admin/permanent-delete-user", {
        method: "POST",
        credentials: "include", // 👈 CLAVE
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: user.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("User permanently deleted");

      // 🔄 refresca la lista
      await fetchArchivedUsers();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setChanging(false);
    }
  };

  if (currentRole !== "admin") {
    return (
      <div className="p-6 pt-24 text-red-600 font-medium">Access denied</div>
    );
  }

  return (
    <div className="p-6 pt-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          🗄️ Archived Users
          {!loading && (
            <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {users.length}
            </span>
          )}
        </h1>

        <button
          onClick={fetchArchivedUsers}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-500">
          <Loader2 className="animate-spin mr-2" />
          Loading archived users...
        </div>
      ) : users.length === 0 ? (
        <p className="text-gray-500">No archived users ({users.length})</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Archived on</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t hover:bg-gray-50 transition">
                  <td className="px-4 py-2 flex items-center gap-3">
                    <div className="relative w-9 h-9">
                      <Image
                        src={
                          u.avatar_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            u.full_name || u.email || "User",
                          )}`
                        }
                        alt="avatar"
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-medium">{u.full_name || "—"}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                  </td>

                  <td className="px-4 py-2 capitalize">{u.role}</td>

                  <td className="px-4 py-2 text-sm text-gray-500">
                    {u.deleted_at
                      ? new Date(u.deleted_at).toLocaleString()
                      : "—"}
                  </td>

                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        disabled={changing}
                        onClick={() => handleReactivate(u.id)}
                        className="flex items-center gap-1 px-3 py-1 text-sm rounded-md bg-green-100 text-green-700 hover:bg-green-200"
                      >
                        <RotateCcw size={14} />
                        Reactivate
                      </button>

                      <button
                        onClick={() => handlePermanentDelete(u)}
                        className="flex items-center gap-1 px-3 py-1 text-sm rounded-md bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
