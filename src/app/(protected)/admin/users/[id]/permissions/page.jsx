"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const RESOURCES = ["properties", "jobs", "keys", "tenants"];

export default function StaffPermissionsPage() {
  const { id: staffProfileId } = useParams();
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD (fila existe = true)
  ========================= */
  useEffect(() => {
    async function loadPermissions() {
      const { data, error } = await supabase
        .from("staff_permissions")
        .select("resource")
        .eq("staff_profile_id", staffProfileId);

      if (error) {
        toast.error("Failed to load permissions");
        return;
      }

      const map = {};
      data.forEach((p) => {
        map[p.resource] = true;
      });

      setPermissions(map);
      setLoading(false);
    }

    loadPermissions();
  }, [staffProfileId]);

  /* =========================
     TOGGLE (INSERT / DELETE)
  ========================= */
  const togglePermission = async (resource) => {
    const value = !permissions[resource];

    // optimistic
    setPermissions((prev) => ({
      ...prev,
      [resource]: value,
    }));

    try {
      const res = await fetch("/api/staff-permissions/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          staff_profile_id: staffProfileId,
          resource,
          can_view: value,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Permission updated");
    } catch (err) {
      toast.error("Failed to update permission");

      // rollback
      setPermissions((prev) => ({
        ...prev,
        [resource]: !value,
      }));
    }
  };

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
              checked={!!permissions[res]}
              onChange={() => togglePermission(res)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
