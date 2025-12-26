"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

/* =========================
   CONFIG (Buildium-style)
========================= */
const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "client_manager", label: "Client (Manager)" },
  { value: "client_basic", label: "Client (Basic)" },
];

const RESOURCES = [
  { key: "property", label: "Properties" },
  { key: "job", label: "Jobs" },
  { key: "tenant", label: "Tenants" },
];

const ACTIONS = ["view", "create", "edit", "delete"];

/* =========================
   PAGE
========================= */
export default function PermissionsPage() {
  const { getToken } = useAuth();

  const [role, setRole] = useState("staff");
  const [matrix, setMatrix] = useState({});
  const [companyId, setCompanyId] = useState(null); // ✅ NUEVO
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* =========================
     LOAD PERMISSIONS
     API → /api/admin/permissions
  ========================= */
  useEffect(() => {
    async function loadPermissions() {
      setLoading(true);
      try {
        const token = await getToken({ template: "supabase" });

        const res = await fetch(`/api/admin/permissions?role=${role}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("LOAD ERROR:", text);
          throw new Error("Failed to load permissions");
        }

        const data = await res.json();

        /**
         * Formato esperado:
         * {
         *   company_id: "...",
         *   matrix: {
         *     property: { view: true, create: false }
         *   }
         * }
         */
        setCompanyId(data.company_id); // ✅ CLAVE
        setMatrix(data.matrix || {});
      } catch (err) {
        console.error(err);
        toast.error("Failed to load permissions");
        setMatrix({});
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, [role, getToken]);

  /* =========================
     TOGGLE PERMISSION
     API → POST /api/admin/permissions
  ========================= */
  async function togglePermission(resource, action, allowed) {
    if (!companyId) return;

    setSaving(true);

    const previous = matrix;

    // Optimistic UI
    setMatrix((prev) => ({
      ...prev,
      [resource]: {
        ...(prev[resource] || {}),
        [action]: allowed,
      },
    }));

    try {
      const token = await getToken({ template: "supabase" });

      const res = await fetch("/api/admin/permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          company_id: companyId, // ✅ FIX REAL
          role,
          resource,
          action,
          allowed,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("SAVE ERROR:", text);
        throw new Error("Save failed");
      }

      toast.success("Permission updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update permission");
      setMatrix(previous); // rollback
    } finally {
      setSaving(false);
    }
  }

  /* =========================
     LOADING STATE
  ========================= */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading permissions…
      </div>
    );
  }

  return (
    <main className="px-6 pt-[120px] max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Permissions</h1>
          <p className="text-gray-500 mt-1">
            Manage role-based access (Buildium style)
          </p>
        </div>

        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* MATRIX */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-4 py-3 font-medium">Resource</th>
              {ACTIONS.map((action) => (
                <th
                  key={action}
                  className="text-center px-4 py-3 font-medium capitalize"
                >
                  {action}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {RESOURCES.map((res) => {
              const perms = matrix[res.key] || {};

              return (
                <tr key={res.key} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">{res.label}</td>

                  {ACTIONS.map((action) => (
                    <td key={action} className="px-4 py-3 text-center">
                      <Checkbox
                        checked={Boolean(perms[action])}
                        onCheckedChange={(value) =>
                          togglePermission(res.key, action, Boolean(value))
                        }
                        disabled={saving}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {saving && (
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving changes…
        </div>
      )}
    </main>
  );
}
