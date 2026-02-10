"use client";

import { Switch } from "@/components/ui/switch";
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
  {
    key: "expenses",
    label: "Expenses",
    description: "View and manage expenses",
  },
  {
    key: "invoices",
    label: "Invoices",
    description: "View and manage invoices",
    notes: "Access to billing, client charges and payment records",
  },
];

/* =========================
   STAFF TEMPLATES
========================= */
const STAFF_TEMPLATES = {
  cleaner: ["jobs"],
  maintenance: ["jobs", "properties", "keys", "expenses"],
  manager: ["jobs", "properties", "keys", "tenants", "expenses"],
  client: ["jobs", "properties", "keys", "tenants", "expenses", "invoices"], // 👈 nuevo
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
          `/api/admin/staff-permissions?staff_profile_id=${staffProfileId}`,
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

      // 🔥 NOTIFICAR A TODA LA APP
      window.dispatchEvent(new CustomEvent("staff-permissions-updated"));
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
  /**RESET */
  async function resetPermissionsToDefault() {
    toast.info("Resetting permissions…");

    for (const mod of STAFF_MODULES) {
      if (permissions[mod.key]) {
        await togglePermission(mod.key, false);
      }
    }

    setActiveTemplate(null);
    toast.success("Permissions reset to default");
  }

  return (
    <div className="p-6 max-w-3xl mt-16">
      <h1 className="text-3xl font-bold mb-2">Staff Access</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Control what this staff member can access.
      </p>

      {/* =========================
        QUICK TEMPLATES
    ========================= */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["cleaner", "maintenance", "manager", "client"].map((tpl) => (
          <button
            key={tpl}
            onClick={() => applyTemplate(tpl)}
            className={`px-3 py-1.5 text-sm rounded-md border font-medium capitalize transition-all
            ${
              activeTemplate === tpl
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {tpl}
          </button>
        ))}

        {/* RESET BUTTON */}
        <button
          onClick={resetPermissionsToDefault}
          className="px-3 py-1.5 text-sm rounded-md border border-red-500 text-red-500 hover:bg-red-50 font-medium"
        >
          🔄 Reset to Default
        </button>
      </div>

      {/* =========================
        MODULE CHECKBOXES
    ========================= */}
      <div className="space-y-3">
        {STAFF_MODULES.map((mod) => (
          <div
            key={mod.key}
            className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 transition-all"
          >
            <div>
              <p className="font-medium text-sm">{mod.label}</p>
              <p className="text-xs text-muted-foreground">{mod.description}</p>

              {mod.notes && (
                <p className="text-xs text-yellow-700 italic mt-1">
                  {mod.notes}
                </p>
              )}
            </div>

            <Switch
              checked={permissions[mod.key] ?? false}
              onCheckedChange={() => togglePermission(mod.key)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
