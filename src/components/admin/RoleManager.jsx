"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function RoleManager({ user }) {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(user.role || "user");

  const updateRole = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: user.clerk_id, newRole: role }),
      });

      if (!res.ok) throw new Error(await res.text());
      toast.success(`✅ Role updated to "${role}"`);
    } catch (err) {
      toast.error("Error updating role");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between border p-3 rounded-lg bg-white dark:bg-gray-900">
      <div>
        <p className="font-medium">{user.full_name}</p>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border rounded-lg px-2 py-1 text-sm bg-transparent dark:border-gray-700"
        >
          <option value="user">User</option>
          <option value="agent">Agent</option>
          <option value="admin">Admin</option>
        </select>

        <button
          onClick={updateRole}
          disabled={loading}
          className="btn-brand text-sm px-3 py-1"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
