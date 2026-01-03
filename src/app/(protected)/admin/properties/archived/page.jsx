"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreVertical, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function ArchivedPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ MULTI SELECT
  const [selectedProperties, setSelectedProperties] = useState(new Set());

  const router = useRouter();

  /* =====================
     LOAD ARCHIVED
  ===================== */
  useEffect(() => {
    let mounted = true;

    async function loadArchived() {
      try {
        const res = await fetch("/api/admin/properties/archived", {
          cache: "no-store",
          credentials: "include",
        });

        const data = await res.json();
        if (mounted) {
          setProperties(data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadArchived();
    return () => (mounted = false);
  }, []);

  /* =====================
     MULTI SELECT HELPERS
  ===================== */
  function togglePropertySelection(id) {
    setSelectedProperties((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedProperties(new Set());
  }

  /* =====================
     BULK RESTORE
  ===================== */
  async function handleBulkRestore() {
    if (selectedProperties.size === 0) return;

    const confirmed = confirm(
      `Restore ${selectedProperties.size} selected properties?`
    );
    if (!confirmed) return;

    const ids = Array.from(selectedProperties);

    try {
      const res = await fetch("/api/admin/properties/archive-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, is_active: true }),
      });

      if (!res.ok) {
        alert("Bulk restore failed");
        return;
      }

      setProperties((prev) => prev.filter((p) => !ids.includes(p.id)));
      clearSelection();
    } catch (err) {
      console.error(err);
      alert("Unexpected bulk restore error");
    }
  }

  /* =====================
     BULK HARD DELETE 🔥
  ===================== */
  async function handleBulkDelete() {
    if (selectedProperties.size === 0) return;

    const confirmed = confirm(
      `⚠️ PERMANENTLY DELETE ${selectedProperties.size} properties?\n\nThis action CANNOT be undone.`
    );
    if (!confirmed) return;

    const ids = Array.from(selectedProperties);

    try {
      const res = await fetch("/api/admin/properties/delete-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) {
        alert("Bulk delete failed");
        return;
      }

      setProperties((prev) => prev.filter((p) => !ids.includes(p.id)));
      clearSelection();
    } catch (err) {
      console.error(err);
      alert("Unexpected bulk delete error");
    }
  }

  /* =====================
     SINGLE RESTORE
  ===================== */
  async function handleRestore(id, name) {
    const confirmed = confirm(`Restore "${name}"?`);
    if (!confirmed) return;

    const res = await fetch(`/api/admin/properties/${id}/archive`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: true }),
    });

    if (res.ok) {
      setProperties((prev) => prev.filter((p) => p.id !== id));
      setSelectedProperties((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      alert("Failed to restore property");
    }
  }

  /* =====================
     SINGLE HARD DELETE
  ===================== */
  async function handleHardDelete(id, name) {
    const confirmed = confirm(
      `⚠️ DELETE "${name}" permanently?\nThis cannot be undone.`
    );
    if (!confirmed) return;

    const res = await fetch(`/api/admin/properties/${id}/delete`, {
      method: "DELETE",
    });

    if (res.ok) {
      setProperties((prev) => prev.filter((p) => p.id !== id));
      setSelectedProperties((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      alert("Failed to delete property");
    }
  }

  if (loading) {
    return (
      <div className="p-10 pt-[130px] text-center text-gray-500">
        Loading archived properties...
      </div>
    );
  }

  return (
    <main className="px-4 sm:px-6 pt-[130px] max-w-[1400px] mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Archived Properties</h1>
          <p className="text-sm text-gray-500 mt-1">
            {properties.length} archived properties
          </p>
        </div>

        <Link href="/admin/properties">
          <Button variant="outline" size="sm" className="flex gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Properties
          </Button>
        </Link>
      </div>

      {/* 🟡 BULK ACTION BAR */}
      {selectedProperties.size > 0 && (
        <div className="flex items-center justify-between bg-white border rounded-lg px-4 py-2 shadow-sm">
          <span className="text-sm font-medium">
            {selectedProperties.size} selected
          </span>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleBulkRestore}>
              Restore Selected
            </Button>

            <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
              Delete Selected
            </Button>

            <Button size="sm" variant="ghost" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* EMPTY */}
      {properties.length === 0 && (
        <p className="text-center text-gray-500 mt-20">
          No archived properties.
        </p>
      )}

      {/* TABLE */}
      {properties.length > 0 && (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={
                      properties.length > 0 &&
                      properties.every((p) => selectedProperties.has(p.id))
                    }
                    onChange={(e) =>
                      e.target.checked
                        ? setSelectedProperties(
                            new Set(properties.map((p) => p.id))
                          )
                        : clearSelection()
                    }
                  />
                </th>
                <th className="px-4 py-3 text-left">Property</th>
                <th className="px-4 py-3 text-left">Address</th>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {properties.map((p) => (
                <tr
                  key={p.id}
                  className={`border-t transition ${
                    selectedProperties.has(p.id)
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selectedProperties.has(p.id)}
                      onChange={() => togglePropertySelection(p.id)}
                    />
                  </td>

                  <td className="px-4 py-2 font-medium">{p.name}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {p.address}
                    {p.unit && `, Unit ${p.unit}`}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {p.companies?.name || "—"}
                  </td>

                  <td className="px-4 py-2 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleRestore(p.id, p.name)}
                        >
                          Restore Property
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="text-red-700 font-semibold"
                          onClick={() => handleHardDelete(p.id, p.name)}
                        >
                          Delete Permanently
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
