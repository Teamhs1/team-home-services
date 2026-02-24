"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/utils/supabase/supabaseClient";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserPlus, Users, Loader2 } from "lucide-react";

export default function CompanyMembersPage() {
  const { id: companyId } = useParams();

  const [companyName, setCompanyName] = useState("");
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [role, setRole] = useState("viewer");
  const [loading, setLoading] = useState(true);
  const [updatingRoleId, setUpdatingRoleId] = useState(null);

  const COMPANY_ROLES = [
    { value: "owner", label: "Owner" },
    { value: "property_manager", label: "Property Manager" },
    { value: "leasing_manager", label: "Leasing Manager" },
    { value: "leasing_agent", label: "Leasing Agent" },
    { value: "maintenance_manager", label: "Maintenance Manager" },
    { value: "maintenance_staff", label: "Maintenance Staff" },
    { value: "viewer", label: "Viewer" },
  ];

  /* =====================
     LOAD COMPANY
  ===================== */
  async function loadCompany() {
    const { data } = await supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single();

    if (data) setCompanyName(data.name);
  }

  /* =====================
     LOAD MEMBERS
  ===================== */
  async function loadMembers() {
    try {
      const res = await fetch(`/api/companies/${companyId}/members`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.message || "Failed to load members");
        return;
      }

      setMembers(json.data || []);
    } catch {
      toast.error("Error loading members");
    }
  }
  /* =====================
     LOAD USERS
  ===================== */
  async function loadUsers() {
    try {
      const res = await fetch("/api/admin/profiles", {
        cache: "no-store",
      });

      const json = await res.json();
      setUsers(json.users || []);
    } catch {
      toast.error("Error loading users");
    }
  }

  useEffect(() => {
    if (!companyId) return;

    Promise.all([loadCompany(), loadMembers(), loadUsers()]).finally(() =>
      setLoading(false),
    );
  }, [companyId]);

  /* =====================
     ADD MEMBER
  ===================== */
  async function addMember() {
    if (!selectedUser) {
      toast.error("Please select a user");
      return;
    }

    try {
      const res = await fetch(`/api/companies/${companyId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: selectedUser,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to add member");
        return;
      }

      toast.success("Member added");
      setSelectedUser("");
      setRole("viewer");
      loadMembers();
    } catch {
      toast.error("Server error");
    }
  }
  /* =====================
     UPDATE ROLE
  ===================== */
  async function updateRole(profileId, newRole, prevRole) {
    if (!profileId || newRole === prevRole) return;

    setUpdatingRoleId(profileId);

    try {
      const res = await fetch(`/api/companies/${companyId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: profileId,
          role: newRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to update role");
        return;
      }

      toast.success("Role updated");
      loadMembers();
    } catch {
      toast.error("Server error");
    } finally {
      setUpdatingRoleId(null);
    }
  }
  /* =====================
     REMOVE MEMBER
  ===================== */
  async function removeMember(profileId) {
    if (!profileId) return;
    if (!confirm("Remove this user from the company?")) return;

    try {
      const res = await fetch(`/api/companies/${companyId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: profileId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to remove member");
        return;
      }

      toast.success("Member removed");
      loadMembers();
    } catch {
      toast.error("Server error");
    }
  }

  if (loading) {
    return (
      <div className="p-10 pt-[130px] text-center text-gray-500">
        Loading members…
      </div>
    );
  }

  return (
    <div className="p-8 pt-[130px] max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {companyName || "Company"} · Members
          </h1>
          <p className="text-sm text-gray-500">
            Manage access and roles for this company
          </p>
        </div>
      </div>

      {/* ADD MEMBER */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-gray-600" />
          <h2 className="font-semibold">Add member</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="">Select user</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name || u.email}
              </option>
            ))}
          </select>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm capitalize"
          >
            {COMPANY_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <Button onClick={addMember}>Add Member</Button>
        </div>
      </div>

      {/* MEMBERS TABLE */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-5 py-3 text-left">Avatar</th>
              <th className="px-5 py-3 text-left">Name</th>
              <th className="px-5 py-3 text-left">Email</th>
              <th className="px-5 py-3 text-center">Role</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {members.map((m) => {
              const profile = m;

              return (
                <tr key={m.id} className="border-t hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <div className="relative w-10 h-10">
                      <Image
                        src={
                          profile.avatar_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            profile.full_name || profile.email || "User",
                          )}&background=2563eb&color=fff`
                        }
                        alt={profile.full_name || "User"}
                        fill
                        sizes="40px"
                        className="rounded-full object-cover border"
                      />
                    </div>
                  </td>

                  <td className="px-5 py-4 font-medium">
                    {profile.full_name || "—"}
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {profile.email || "—"}
                  </td>

                  <td className="px-5 py-4 text-center">
                    <select
                      value={m.role}
                      disabled={updatingRoleId === profile.profile_id}
                      onChange={(e) =>
                        updateRole(profile.profile_id, e.target.value, m.role)
                      }
                      className="border rounded-md px-2 py-1 text-xs capitalize"
                    >
                      {COMPANY_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => removeMember(profile.profile_id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {members.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            No members assigned yet.
          </div>
        )}
      </div>
    </div>
  );
}
