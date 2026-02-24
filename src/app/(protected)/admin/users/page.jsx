"use client";
import { MoreVertical } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

import { useEffect, useState, useMemo } from "react";

import Image from "next/image";
import { Loader2, Search, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [changing, setChanging] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [myProfile, setMyProfile] = useState(null);

  const currentRole = myProfile?.role;

  const isSystemAdmin =
    currentRole === "admin" || currentRole === "super_admin";

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
        });

        const data = await res.json();

        if (res.ok) {
          setMyProfile(data);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    };

    fetchMe();
  }, []);
  // 🔹 Cargar usuarios desde Supabase (con Clerk JWT)
  const fetchUsers = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/users", {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to load users");
      }

      setUsers(json.users || []);
    } catch (err) {
      console.error("❌ Error loading users:", err);
      setError("Could not load users.");
    } finally {
      setLoading(false);
    }
  };
  // 🔄 Escucha cambios en tiempo real
  useEffect(() => {
    fetchUsers();
  }, []);

  // 🧩 Sincronización completa: Backfill + Sync Roles
  const handleSyncAll = async () => {
    try {
      setSyncingAll(true);
      toast.info("⏳ Starting full synchronization...");

      const backfillRes = await fetch("/api/admin/backfill-clerk-users", {
        method: "POST",
      });

      const backfillData = await backfillRes.json();

      if (!backfillRes.ok) {
        throw new Error(backfillData.error || "Backfill failed");
      }

      // ✅ MENSAJE HONESTO
      if (backfillData.updated > 0) {
        toast.success(`✅ ${backfillData.updated} users synchronized`);
      } else {
        toast.info("ℹ️ No users needed synchronization");
      }

      const syncRes = await fetch("/api/admin/sync-roles", {
        method: "POST",
        credentials: "include",
      });

      if (!syncRes.ok) {
        const text = await syncRes.text();
        throw new Error(text || "Role synchronization failed");
      }

      toast.success("✅ Roles synced successfully!");

      await fetchUsers();
      router.refresh();
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
  // 🗑️ Eliminar usuario (admin only)
  const handleDeleteUser = async (userRow) => {
    const confirmed = window.confirm(
      `Deactivate user:\n\n${userRow.full_name || userRow.email}?`,
    );

    if (!confirmed) return;

    try {
      const res = await fetch("/api/admin/deactivate-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: userRow.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("User deactivated");
      await fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // 🔁 Move staff to another company (admin only)
  const handleMoveStaff = async (staffClerkId) => {
    const targetCompanyId = window.prompt("Enter target company ID (UUID)");

    if (!targetCompanyId) return;

    try {
      setChanging(true);
      toast.info("⏳ Moving staff to company...");

      const res = await fetch("/api/admin/move-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_clerk_id: staffClerkId,
          target_company_id: targetCompanyId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Move failed");
      }

      toast.success("✅ Staff moved successfully");
      await fetchUsers();
    } catch (err) {
      console.error("❌ Move staff error:", err);
      toast.error(err.message);
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
    <div className="pt-24 p-6">
      {/* 🔹 Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          👥 User Management
        </h1>

        {isSystemAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncAll}
              disabled={syncingAll}
              className="flex items-center gap-2 px-4 py-2
                   bg-indigo-600 hover:bg-indigo-700
                   text-white text-sm font-medium rounded-lg
                   disabled:opacity-50 transition"
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
          </div>
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

          {/* CORE */}
          <option value="admin">Admin (System Owner)</option>
          <option value="staff">Staff (Internal)</option>
          <option value="super_admin">Super Admin</option>

          {/* CLIENT SIDE */}
          <option value="client">Client / Owner</option>

          {/* FUTURE (NO ROMPE) */}
          <option value="tenant" disabled>
            Tenant (coming soon)
          </option>
          <option value="vendor" disabled>
            Vendor / Contractor (coming soon)
          </option>
          <option value="manager" disabled>
            Property Manager (coming soon)
          </option>
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

                {currentRole === "super_admin" && (
                  <th className="px-4 py-2">Company</th>
                )}

                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Joined</th>

                {isSystemAdmin && (
                  <th className="px-4 py-2 text-right">Actions</th>
                )}
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
                    <div className="relative w-10 h-10">
                      <Image
                        src={
                          user.avatar_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            user.full_name || user.email || "User",
                          )}&background=2563eb&color=fff`
                        }
                        alt={user.full_name || "User"}
                        fill
                        sizes="40px"
                        className="rounded-full object-cover border"
                      />
                    </div>
                  </td>

                  <td
                    className="px-4 py-2 text-blue-600 hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/admin/profiles/${user.id}`;
                    }}
                  >
                    {user.full_name || "—"}
                  </td>

                  <td className="px-4 py-2">{user.email || "—"}</td>
                  {currentRole === "super_admin" && (
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md font-medium">
                        {user.companies?.name || "No company"}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-2">
                    <div className="flex flex-col text-sm leading-tight">
                      {/* Rol principal */}
                      <span className="capitalize font-medium">
                        {user.role === "super_admin" ? (
                          <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-md">
                            Super Admin
                          </span>
                        ) : currentRole === "admin" ||
                          currentRole === "super_admin" ? (
                          <select
                            value={user.role || "client"}
                            onClick={(e) => e.stopPropagation()}
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
                      </span>

                      {/* Contexto SOLO para clientes */}
                      {user.role === "client" && (
                        <span className="text-xs text-gray-500">
                          {user.is_property_manager && user.company_id
                            ? "Company client"
                            : "Individual owner"}
                        </span>
                      )}
                    </div>
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
                  {currentRole === "super_admin" && (
                    <td
                      className="px-4 py-2 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                            <MoreVertical size={16} />
                          </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() =>
                              (window.location.href = `/admin/profiles/${user.id}`)
                            }
                          >
                            View profile
                          </DropdownMenuItem>

                          {user.role === "staff" && (
                            <DropdownMenuItem
                              onClick={() => handleMoveStaff(user.clerk_id)}
                            >
                              Move to company
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-700"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete user
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
