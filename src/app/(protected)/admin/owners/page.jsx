"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";

export default function OwnersPage() {
  const router = useRouter();
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadOwners() {
      const res = await fetch("/api/admin/owners", {
        credentials: "include",
      });
      const data = await res.json();
      setOwners(data.owners || []);
      setLoading(false);
    }
    loadOwners();
  }, []);

  const filteredOwners = useMemo(() => {
    return owners.filter(
      (o) =>
        o.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        o.email?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [owners, search]);

  if (loading) {
    return <div className="p-10 text-sm text-gray-500">Loading owners…</div>;
  }

  return (
    <div className="p-8 pt-[130px] space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Owners</h1>
        <p className="text-sm text-gray-500">
          Property owners registered in the system
        </p>
      </div>

      {/* ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* SEARCH */}
        <div className="relative w-full sm:max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="
              w-full pl-9 pr-3 py-2 rounded-lg border
              text-sm
              focus:outline-none focus:ring-2 focus:ring-primary
            "
          />
        </div>

        {/* ADD */}
        <button
          onClick={() => router.push("/admin/owners/create")}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm hover:opacity-90"
        >
          <Plus size={16} />
          Add Owner
        </button>
      </div>

      {/* EMPTY STATES */}
      {owners.length === 0 && (
        <div className="text-center text-gray-500 text-sm py-16">
          No owners found.
        </div>
      )}

      {owners.length > 0 && filteredOwners.length === 0 && search && (
        <div className="text-center text-gray-500 text-sm py-16">
          No owners match your search.
        </div>
      )}

      {/* LIST */}
      {filteredOwners.length > 0 && (
        <div className="grid gap-3">
          {filteredOwners.map((o) => (
            <button
              key={o.id}
              onClick={() => router.push(`/admin/owners/${o.id}`)}
              className="
                flex items-center gap-4
                rounded-xl border bg-white p-4
                hover:shadow-sm hover:bg-gray-50
                transition text-left
              "
            >
              {/* AVATAR */}
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
                {o.full_name?.[0]?.toUpperCase() || "O"}
              </div>

              {/* INFO */}
              <div className="flex flex-col">
                <span className="font-medium leading-tight">
                  {o.full_name || "Unnamed Owner"}
                </span>
                <span className="text-sm text-gray-500">{o.email}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
