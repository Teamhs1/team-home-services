"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

const RESOURCES = ["properties", "jobs", "keys", "tenants"];

export default function StaffPermissionsPage() {
  const { id: staffProfileId } = useParams();
  const router = useRouter();

  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD PERMISSIONS (READ)
  ========================= */
  useEffect(() => {
    if (!staffProfileId) return;

    async function loadPermissions() {
      try {
        const res = await fetch(
          `/api/admin/staff-permissions?staff_profile_id=${staffProfileId}`
        );

        if (!res.ok) throw new Error();

        const data = await res.json();

        const map = {};
        data.forEach((p) => {
          map[p.resource] = true;
        });

        setPermissions(map);
      } catch (err) {
        toast.error("Failed to load permissions");
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, [staffProfileId]);

  /* =========================
     TOGGLE PERMISSION (WRITE)
  ========================= */
  async function togglePermission(resource) {
    const nextValue = !permissions[resource];

    // Optimistic update
    setPermissions((prev) => ({
      ...prev,
      [resource]: nextValue,
    }));

    const res = await fetch("/api/admin/staff-permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staff_profile_id: staffProfileId,
        resource,
        can_view: nextValue,
      }),
    });

    if (!res.ok) {
      toast.error("Failed to update permission");
      setPermissions((prev) => ({
        ...prev,
        [resource]: !nextValue,
      }));
    } else {
      toast.success("Permission updated");
    }
  }

  if (!staffProfileId) return <p className="p-6">Invalid staff ID</p>;
  if (loading) return <p className="p-6">Loading permissions...</p>;

  return (
    <div className="p-6 max-w-xl mt-16">
      <h1 className="text-2xl font-bold mb-4">Staff permissions</h1>

      <div className="space-y-4">
        {RESOURCES.map((res) => (
          <label
            key={res}
            className="flex items-center justify-between border rounded p-3"
          >
            <span className="capitalize">{res}</span>
            <input
              type="checkbox"
              checked={permissions[res] ?? false}
              onChange={() => togglePermission(res)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
