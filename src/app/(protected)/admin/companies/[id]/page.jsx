"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function CompanyPortfolioPage() {
  const { id } = useParams();

  const [company, setCompany] = useState(null);
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =====================
     LOAD COMPANY DATA
  ===================== */
  useEffect(() => {
    let mounted = true;

    async function loadCompanyData() {
      setLoading(true);

      try {
        /* ---------- COMPANY ---------- */
        const resCompany = await fetch(`/api/admin/companies/${id}`, {
          cache: "no-store",
        });

        if (!resCompany.ok) {
          toast.error("Error loading company");
          setLoading(false);
          return;
        }

        const comp = await resCompany.json();
        if (!mounted) return;

        setCompany(comp);

        /* ---------- PROPERTIES ---------- */
        const resProps = await fetch(`/api/admin/companies/${id}/properties`, {
          cache: "no-store",
        });

        const props = resProps.ok ? await resProps.json() : [];
        if (!mounted) return;

        setProperties(props || []);

        /* ---------- USERS (via API / service role) ---------- */
        try {
          const resUsers = await fetch(`/api/companies/${id}/members`, {
            cache: "no-store",
          });

          if (!resUsers.ok) {
            console.error("❌ Error fetching company members");
            setUsers([]);
          } else {
            const json = await resUsers.json();

            const normalizedUsers = (json.members || [])
              .map((m) => ({
                id: m.profiles?.id,
                full_name: m.profiles?.full_name || "",
                email: m.profiles?.email || "",
                company_role: m.role,
              }))
              .sort((a, b) =>
                a.full_name.localeCompare(b.full_name, undefined, {
                  sensitivity: "base",
                })
              );

            setUsers(normalizedUsers);
          }
        } catch (err) {
          console.error("❌ Members fetch failed:", err);
          setUsers([]);
        }
      } catch (err) {
        console.error("LOAD COMPANY ERROR:", err);
        toast.error("Unexpected error loading company");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (id) loadCompanyData();
    return () => {
      mounted = false;
    };
  }, [id]);

  /* =====================
     LOADING / ERROR
  ===================== */
  if (loading) {
    return (
      <div className="p-10 pt-[130px] text-center text-gray-500">
        Loading company portfolio…
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-10 pt-[130px] text-center text-gray-500">
        Company not found.
      </div>
    );
  }

  return (
    <div className="p-8 pt-[130px] max-w-6xl mx-auto space-y-10">
      {/* BREADCRUMB */}
      <div className="text-sm text-gray-500">
        <Link href="/admin/companies" className="hover:underline">
          Companies
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700 font-medium">{company.name}</span>
      </div>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{company.name}</h1>
          <p className="text-gray-500 text-sm">Company portfolio overview</p>
        </div>

        <Link
          href={`/admin/companies/${id}/edit`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          Edit Company
        </Link>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard label="Properties" value={properties.length} />
        <StatCard label="Users" value={users.length} />
        <StatCard
          label="Created"
          value={new Date(company.created_at).toLocaleDateString()}
        />
      </div>

      {/* COMPANY DETAILS */}
      <Section title="Company Details">
        <Detail label="Email" value={company.email} />
        <Detail label="Phone" value={company.phone} />
        <Detail
          label="Notes"
          value={company.notes}
          emptyText="No notes added"
        />
      </Section>

      {/* USERS */}
      <Section title="Users in this Company">
        {users.length === 0 ? (
          <Empty text="No users assigned to this company." />
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex justify-between items-center border rounded-lg p-4 bg-white hover:shadow-sm transition"
              >
                <div>
                  <p className="font-semibold">{u.full_name}</p>
                  <p className="text-sm text-gray-600">{u.email}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    Role: {u.company_role || "not assigned"}
                  </p>
                </div>

                <Link
                  href={`/admin/profiles/${u.id}/edit`}
                  className="text-blue-600 text-sm hover:underline"
                >
                  Edit →
                </Link>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* PROPERTIES */}
      <Section title="Properties">
        {properties.length === 0 ? (
          <Empty text="This company has no properties." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => (
              <div
                key={p.id}
                className="border rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition"
              >
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-gray-600">{p.address}</p>
                {p.unit && (
                  <p className="text-xs text-gray-500">Unit {p.unit}</p>
                )}

                <Link
                  href={`/admin/properties/${p.id}/edit`}
                  className="inline-block mt-3 text-blue-600 text-sm hover:underline"
                >
                  Edit Property →
                </Link>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

/* =====================
   UI HELPERS
===================== */
function Section({ title, children }) {
  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="border rounded-xl bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function Detail({ label, value, emptyText = "Not provided" }) {
  return (
    <p className="text-sm">
      <strong>{label}:</strong>{" "}
      {value || <span className="text-gray-500">{emptyText}</span>}
    </p>
  );
}

function Empty({ text }) {
  return <p className="text-gray-500 text-sm">{text}</p>;
}
