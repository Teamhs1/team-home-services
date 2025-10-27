"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import { Loader2, Search, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminUsersPage() {
  const { user } = useUser();
  const currentRole = user?.publicMetadata?.role || "client";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [changing, setChanging] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // 🔹 Cargar usuarios desde Supabase
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, clerk_id, full_name, email, avatar_url, role, status, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data);
    } catch (err) {
      console.error("❌ Error loading users:", err.message);
      setError("Could not load users.");
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Escucha cambios en tiempo real
  useEffect(() => {
    fetchUsers();
    const channel = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          console.log("🔁 Realtime update:", payload);
          fetchUsers();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 🧩 Sincronización completa: Backfill + Sync Roles
  const handleSyncAll = async () => {
    try {
      setSyncingAll(true);
      toast.info("⏳ Starting full synchronization...");

      // 1️⃣ Ejecutar Backfill primero
      const backfillRes = await fetch("/api/admin/backfill-clerk-users", {
        method: "POST",
      });
      const backfillData = await backfillRes.json();

      if (!backfillRes.ok)
        throw new Error(backfillData.error || "Backfill failed");

      toast.success("✅ Step 1: Clerk users backfilled successfully.");

      // 2️⃣ Ejecutar Sync Roles después
      const syncRes = await fetch("/api/admin/sync-roles", {
        method: "POST",
        credentials: "include",
      });
      const syncData = await syncRes.text();

      if (!syncRes.ok)
        throw new Error(syncData || "Role synchronization failed");

      toast.success("✅ Step 2: Roles synced successfully!");
      await fetchUsers();
    } catch (err) {
      console.error("❌ Full sync error:", err);
      toast.error("⚠️ Sync failed: " + err.message);
    } finally {
      setSyncingAll(false);
    }
  };

  // ✏️ Cambiar rol individual
  const handleRoleChange = async (clerkId, roleValue) => {
    if (!clerkId || !roleValue) {
      toast.error("Missing fields for update.");
      return;
    }

    try {
      setChanging(true);
      toast.info(`⏳ Updating role to "${roleValue}"...`);

      const res = await fetch("/api/admin/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: clerkId, newRole: roleValue }),
      });

      const text = await res.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        result = { message: text };
      }

      if (!res.ok) {
        toast.error(`❌ Failed: ${result.message || "Update failed"}`);
        throw new Error(result.message || "Update failed");
      }

      toast.success(`✅ Role updated to "${roleValue}"`);
      await fetchUsers();
    } catch (err) {
      console.error("❌ Error updating role:", err);
      toast.error(`⚠️ Unexpected error: ${err.message}`);
    } finally {
      setChanging(false);
    }
  };

  // 🔍 Filtro y búsqueda
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  return (
    <div className="p-6">
      {/* 🔹 Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          👥 User Management
        </h1>

        {currentRole === "admin" && (
          <button
            onClick={handleSyncAll}
            disabled={syncingAll}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition"
          >
            {syncingAll ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCcw size={18} />
                Sync All Users
              </>
            )}
          </button>
        )}
      </div>

      {/* 🔹 Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm"
        >
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="client">Client</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* 🔹 Tabla */}
      {loading ? (
        <div className="flex justify-center items-center h-48 text-gray-500">
          <Loader2 className="animate-spin mr-2" /> Loading users...
        </div>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : filteredUsers.length === 0 ? (
        <p className="text-gray-500">No users found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 dark:bg-gray-800 text-left">
              <tr>
                <th className="px-4 py-2">Avatar</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.clerk_id}
                  data-user-id={user.clerk_id}
                  onClick={() =>
                    (window.location.href = `/admin/profiles/${user.id}`)
                  }
                  className="cursor-pointer border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
                >
                  <td className="px-4 py-2">
                    <Image
                      src={
                        user.avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.full_name || "User"
                        )}&background=random&color=fff`
                      }
                      alt={user.full_name || "User"}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  </td>
                  <td className="px-4 py-2 text-blue-600 hover:underline">
                    {user.full_name || "—"}
                  </td>
                  <td className="px-4 py-2">{user.email || "—"}</td>
                  <td className="px-4 py-2 capitalize">
                    {currentRole === "admin" ? (
                      <select
                        value={user.role || "client"}
                        onChange={(e) =>
                          handleRoleChange(user.clerk_id, e.target.value)
                        }
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                        disabled={changing}
                      >
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="client">Client</option>
                      </select>
                    ) : (
                      user.role
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {user.status || "unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
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
