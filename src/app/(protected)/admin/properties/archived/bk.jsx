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
     RESTORE PROPERTY
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
    } else {
      alert("Failed to restore property");
    }
  }

  /* =====================
     HARD DELETE
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
                <th className="px-4 py-3 text-left">Property</th>
                <th className="px-4 py-3 text-left">Address</th>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {properties.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
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
