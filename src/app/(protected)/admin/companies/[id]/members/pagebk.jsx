"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/utils/supabase/supabaseClient";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserPlus, Users } from "lucide-react";

export default function CompanyMembersPage() {
  const { id: companyId } = useParams();

  const [companyName, setCompanyName] = useState("");
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [role, setRole] = useState("staff");
  const [loading, setLoading] = useState(true);

  /* =====================
     LOAD COMPANY
  ===================== */
  async function loadCompany() {
    const { data, error } = await supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single();

    if (!error && data) {
      setCompanyName(data.name);
    }
  }

  /* =====================
     LOAD MEMBERS
  ===================== */
  async function loadMembers() {
    try {
      const res = await fetch(`/api/companies/${companyId}/members`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to load members");
        return;
      }

      setMembers(data.members || []);
    } catch (err) {
      console.error(err);
      toast.error("Error loading members");
    }
  }

  /* =====================
     LOAD USERS
  ===================== */
  async function loadUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name");

    if (!error) setUsers(data || []);
  }

  useEffect(() => {
    Promise.all([loadCompany(), loadMembers(), loadUsers()]).finally(() =>
      setLoading(false)
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_id: selectedUser,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to add member");
        return;
      }

      toast.success("Member added to company");
      setSelectedUser("");
      setRole("staff");
      loadMembers();
    } catch (err) {
      console.error(err);
      toast.error("Server error");
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_id: profileId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to remove member");
        return;
      }

      toast.success("Member removed from company");
      loadMembers();
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  }

  if (loading) {
    return (
      <div className="p-10 pt-[130px] text-center text-gray-500">
        Loading members...
      </div>
    );
  }

  return (
    <div className="p-8 pt-[130px] max-w-4xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <div className="h-11 w-11 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>

        <div>
          <h1 className="text-2xl font-bold leading-tight">
            {companyName || "Company"} · Members
          </h1>
          <p className="text-sm text-gray-500">
            Manage users and roles for this company
          </p>
        </div>
      </div>

      {/* ADD MEMBER */}
      <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
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
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
            <option value="viewer">Viewer</option>
          </select>

          <Button onClick={addMember}>Add Member</Button>
        </div>
      </div>

      {/* MEMBERS LIST */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-center">Role</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium">
                  {m.profiles?.full_name || "—"}
                </td>

                <td className="px-4 py-3 text-gray-600">
                  {m.profiles?.email || "—"}
                </td>

                {/* ✅ ROLE (ESTO FALTABA) */}
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-semibold rounded-full capitalize ${
                      m.role === "owner"
                        ? "bg-purple-100 text-purple-700"
                        : m.role === "manager"
                        ? "bg-blue-100 text-blue-700"
                        : m.role === "staff"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {m.role}
                  </span>
                </td>

                {/* ACTIONS */}
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => removeMember(m.profiles?.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
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
