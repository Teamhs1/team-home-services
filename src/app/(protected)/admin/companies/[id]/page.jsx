"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function CompanyPortfolioPage() {
  const { id } = useParams();
  const router = useRouter();

  const [company, setCompany] = useState(null);
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load company info, properties, users
  useEffect(() => {
    async function loadCompanyData() {
      // load company
      const { data: comp, error: cErr } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();

      if (cErr) {
        toast.error("Error loading company");
        console.error(cErr);
        return;
      }
      setCompany(comp);

      // load properties linked to this company
      const { data: props, error: pErr } = await supabase
        .from("properties")
        .select(
          `
          id,
          name,
          address,
          unit
        `
        )
        .eq("company_id", id)
        .order("name", { ascending: true });

      if (pErr) console.error(pErr);
      setProperties(props || []);

      // load users linked to this company
      const { data: profs, error: uErr } = await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          email,
          company_role
        `
        )
        .eq("company_id", id)
        .order("full_name", { ascending: true });

      if (uErr) console.error(uErr);
      setUsers(profs || []);

      setLoading(false);
    }

    loadCompanyData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-10 text-center pt-[130px] text-gray-500">
        Loading company portfolio...
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-10 text-center pt-[130px] text-gray-500">
        Company not found.
      </div>
    );
  }

  return (
    <div className="p-8 pt-[130px]">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{company.name} — Portfolio</h1>

        <Link
          href={`/admin/companies/${id}/edit`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          Edit Company
        </Link>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="p-5 border rounded-xl bg-white shadow-sm">
          <h3 className="text-lg font-semibold">Properties</h3>
          <p className="text-3xl font-bold mt-2">{properties.length}</p>
        </div>

        <div className="p-5 border rounded-xl bg-white shadow-sm">
          <h3 className="text-lg font-semibold">Users</h3>
          <p className="text-3xl font-bold mt-2">{users.length}</p>
        </div>

        <div className="p-5 border rounded-xl bg-white shadow-sm">
          <h3 className="text-lg font-semibold">Created</h3>
          <p className="text-lg mt-2">
            {new Date(company.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* COMPANY DETAILS */}
      <div className="mb-10 p-6 border bg-white rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Company Details</h2>

        <p>
          <strong>Email:</strong>{" "}
          {company.email || <span className="text-gray-500">Not provided</span>}
        </p>
        <p>
          <strong>Phone:</strong>{" "}
          {company.phone || <span className="text-gray-500">Not provided</span>}
        </p>
        <p className="mt-2">
          <strong>Notes:</strong>
          <br />
          {company.notes || (
            <span className="text-gray-500">No notes added</span>
          )}
        </p>
      </div>

      {/* USERS LIST */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Users in this Company</h2>

        {users.length === 0 ? (
          <p className="text-gray-500">No users assigned to this company.</p>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="border p-4 rounded-lg bg-white shadow-sm flex justify-between"
              >
                <div>
                  <p className="font-semibold">{u.full_name}</p>
                  <p className="text-sm text-gray-600">{u.email}</p>
                  <p className="text-sm text-gray-500">
                    Role: {u.company_role || "Not assigned"}
                  </p>
                </div>

                <Link
                  href={`/admin/profiles/${u.id}/edit`}
                  className="text-blue-600 hover:underline"
                >
                  Edit →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PROPERTIES LIST */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Properties</h2>

        {properties.length === 0 ? (
          <p className="text-gray-500">This company has no properties.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => (
              <div
                key={p.id}
                className="border rounded-lg bg-white p-5 shadow-sm hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="text-sm text-gray-600">{p.address}</p>
                {p.unit && (
                  <p className="text-sm text-gray-500">Unit {p.unit}</p>
                )}

                <Link
                  href={`/admin/properties/${p.id}/edit`}
                  className="text-blue-600 hover:underline text-sm mt-3 inline-block"
                >
                  Edit Property →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
