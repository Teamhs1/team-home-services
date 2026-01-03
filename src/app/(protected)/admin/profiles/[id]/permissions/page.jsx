"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

/* =========================
   STAFF MODULES
========================= */
const STAFF_MODULES = [
  { key: "jobs", label: "Jobs", description: "View and manage work orders" },
  {
    key: "properties",
    label: "Properties",
    description: "Access property information",
  },
  { key: "keys", label: "Keys", description: "Manage physical & digital keys" },
  { key: "tenants", label: "Tenants", description: "View tenant information" },
];

/* =========================
   STAFF TEMPLATES
========================= */
const STAFF_TEMPLATES = {
  cleaner: ["jobs"],
  maintenance: ["jobs", "properties", "keys"],
  manager: ["jobs", "properties", "keys", "tenants"],
};

export default function StaffPermissionsPage() {
  const { id: staffProfileId } = useParams();

  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTemplate, setActiveTemplate] = useState(null);

  /* =========================
     LOAD PERMISSIONS
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
        data.forEach((p) => (map[p.resource] = true));
        setPermissions(map);

        // 🔍 detectar si coincide con un template
        detectActiveTemplate(map);
      } catch {
        toast.error("Failed to load permissions");
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, [staffProfileId]);

  /* =========================
     DETECT TEMPLATE
  ========================= */
  function detectActiveTemplate(currentPermissions) {
    for (const [template, allowed] of Object.entries(STAFF_TEMPLATES)) {
      const matches = STAFF_MODULES.every((m) => {
        const should = allowed.includes(m.key);
        return (currentPermissions[m.key] ?? false) === should;
      });

      if (matches) {
        setActiveTemplate(template);
        return;
      }
    }

    setActiveTemplate(null);
  }

  /* =========================
     TOGGLE PERMISSION
  ========================= */
  async function togglePermission(resource, forceValue = null) {
    const nextValue = forceValue !== null ? forceValue : !permissions[resource];

    setPermissions((prev) => ({
      ...prev,
      [resource]: nextValue,
    }));

    setActiveTemplate(null); // 👈 manual override

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

  /* =========================
     APPLY TEMPLATE
  ========================= */
  async function applyTemplate(templateKey) {
    const allowed = STAFF_TEMPLATES[templateKey];

    toast.info(`Applying ${templateKey} template...`);

    for (const mod of STAFF_MODULES) {
      const shouldHave = allowed.includes(mod.key);
      const hasNow = permissions[mod.key] ?? false;

      if (shouldHave !== hasNow) {
        await togglePermission(mod.key, shouldHave);
      }
    }

    setActiveTemplate(templateKey);
    toast.success("Template applied");
  }

  if (!staffProfileId) return <p className="p-6">Invalid staff ID</p>;
  if (loading) return <p className="p-6">Loading permissions...</p>;

  return (
    <div className="p-6 max-w-2xl mt-16">
      <h1 className="text-2xl font-bold mb-2">Staff Access</h1>
      <p className="text-sm text-gray-500 mb-4">
        Control what this staff member can access.
      </p>

      {/* =========================
          QUICK TEMPLATES
      ========================= */}
      <div className="flex gap-2 mb-6">
        {["cleaner", "maintenance", "manager"].map((tpl) => (
          <button
            key={tpl}
            onClick={() => applyTemplate(tpl)}
            className={`px-3 py-1.5 text-sm rounded-md border transition
              ${
                activeTemplate === tpl
                  ? "bg-blue-600 text-white border-blue-600"
                  : "hover:bg-gray-100"
              }`}
          >
            {tpl.charAt(0).toUpperCase() + tpl.slice(1)}
          </button>
        ))}
      </div>

      {/* =========================
          MODULE CHECKBOXES
      ========================= */}
      <div className="space-y-3">
        {STAFF_MODULES.map((mod) => (
          <div
            key={mod.key}
            className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 transition"
          >
            <div>
              <p className="font-medium">{mod.label}</p>
              <p className="text-xs text-gray-500">{mod.description}</p>
            </div>

            <input
              type="checkbox"
              className="h-5 w-5 accent-blue-600"
              checked={permissions[mod.key] ?? false}
              onChange={() => togglePermission(mod.key)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
