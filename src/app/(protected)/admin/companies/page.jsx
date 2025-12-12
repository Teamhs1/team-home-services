"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CompaniesListPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompanies() {
      const res = await fetch("/api/companies", { cache: "no-store" });
      const data = await res.json();

      if (Array.isArray(data)) {
        setCompanies(data);
      }

      setLoading(false);
    }

    loadCompanies();
  }, []);

  if (loading) {
    return (
      <div className="p-10 pt-[130px] text-center text-gray-500">
        Loading companies...
      </div>
    );
  }

  return (
    <div className="p-8 pt-[130px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Companies</h1>

        <Link
          href="/admin/companies/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          + Add Company
        </Link>
      </div>

      {companies.length === 0 ? (
        <p className="text-gray-500 mt-20 text-center">No companies found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {companies.map((c) => (
            <div
              key={c.id}
              className="border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold mb-1">{c.name}</h2>

              <p className="text-sm text-gray-600">
                Email: {c.email || "Not provided"}
              </p>

              <p className="text-sm text-gray-600 mb-3">
                Phone: {c.phone || "Not provided"}
              </p>

              <p className="text-sm">
                <strong>Properties:</strong> {c.properties?.[0]?.count ?? 0}
              </p>

              <p className="text-sm mb-4">
                <strong>Users:</strong> {c.users?.[0]?.count ?? 0}
              </p>

              <div className="flex flex-col gap-2">
                <Link
                  href={`/admin/companies/${c.id}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  View Portfolio →
                </Link>

                <Link
                  href={`/admin/companies/${c.id}/edit`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Edit Company →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
