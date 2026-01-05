"use client";

import { MoreVertical, LayoutGrid, List } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CompaniesListPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const router = useRouter();

  /* =====================
     LOAD COMPANIES
  ===================== */
  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch("/api/admin/companies", { cache: "no-store" });
        const data = await res.json();

        if (Array.isArray(data)) {
          setCompanies(data);
        } else {
          setCompanies([]);
        }
      } catch (err) {
        console.error("Load companies error:", err);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    }

    loadCompanies();
  }, []);

  // 🔒 Force grid on mobile
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setViewMode("grid");
    }
  }, []);

  /* =====================
     DELETE COMPANY
  ===================== */
  async function handleDeleteCompany(id, name) {
    const confirmed = confirm(
      `Are you sure you want to delete "${name}"?\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/companies/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json?.error || "Unable to delete company");
        return;
      }

      setCompanies((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Unexpected error deleting company");
    }
  }

  if (loading) {
    return (
      <div className="p-10 pt-[130px] text-center text-gray-500">
        Loading companies...
      </div>
    );
  }

  return (
    <main className="px-4 sm:px-6 pt-[130px] max-w-[1600px] mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold">🏢 Companies</h1>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="hidden sm:flex items-center gap-2"
          >
            {viewMode === "grid" ? (
              <List className="w-4 h-4" />
            ) : (
              <LayoutGrid className="w-4 h-4" />
            )}
          </Button>

          <Link
            href="/admin/companies/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            + Add Company
          </Link>
        </div>
      </div>

      {/* EMPTY */}
      {companies.length === 0 && (
        <p className="text-gray-500 mt-20 text-center">No companies found.</p>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && companies.length > 0 ? (
        <div className="hidden sm:block bg-white border rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-center">Properties</th>
                <th className="px-4 py-3 text-center">Users</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {companies.map((c) => {
                const companyId = c.id;
                const propertiesCount = c.properties_count ?? 0;
                const usersCount = c.users_count ?? 0;
                const canDelete = propertiesCount === 0 && usersCount <= 1;

                return (
                  <tr
                    key={companyId}
                    onClick={() => router.push(`/admin/companies/${companyId}`)}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">{propertiesCount}</td>
                    <td className="px-4 py-3 text-center">{usersCount}</td>

                    <td
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/companies/${companyId}`}>
                              View Company
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/companies/${companyId}/members`}
                            >
                              View Members
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild>
                            <Link href={`/admin/companies/${companyId}/edit`}>
                              Edit Company
                            </Link>
                          </DropdownMenuItem>

                          {canDelete ? (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() =>
                                handleDeleteCompany(companyId, c.name)
                              }
                            >
                              Delete Company
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem disabled>
                              Delete (has users or properties)
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {companies.map((c) => {
            const companyId = c.id;

            return (
              <div
                key={companyId}
                className="border rounded-2xl bg-white shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
              >
                <div>
                  <h2 className="text-lg font-semibold truncate">{c.name}</h2>
                  <p className="text-sm text-gray-600">
                    {c.email || "No email"}
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    {c.phone || "No phone"}
                  </p>
                </div>

                <div className="pt-4 flex flex-col gap-2 text-sm">
                  <Link
                    href={`/admin/companies/${companyId}`}
                    className="text-blue-600 hover:underline"
                  >
                    View Portfolio →
                  </Link>
                  <Link
                    href={`/admin/companies/${companyId}/members`}
                    className="text-blue-600 hover:underline"
                  >
                    View Members →
                  </Link>
                  <Link
                    href={`/admin/companies/${companyId}/edit`}
                    className="text-blue-600 hover:underline"
                  >
                    Edit Company →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
