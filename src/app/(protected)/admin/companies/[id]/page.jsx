"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";

export default function CompanyPortfolioPage() {
  const { id } = useParams();

  const [company, setCompany] = useState(null);
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadCompanyData() {
      setLoading(true);

      try {
        /* =========================
         COMPANY
      ========================== */
        const resCompany = await fetch(`/api/admin/companies/${id}`, {
          cache: "no-store",
        });

        if (!resCompany.ok) {
          toast.error("Error loading company");
          return;
        }

        const companyJson = await resCompany.json();

        const companyData =
          companyJson?.data ??
          (companyJson?.success ? companyJson?.data : null);

        if (!companyData) {
          toast.error("Company not found");
          return;
        }

        if (!mounted) return;
        setCompany(companyData);

        /* =========================
   PROPERTIES
========================= */
        const resProps = await fetch(`/api/admin/companies/${id}/properties`, {
          cache: "no-store",
        });

        let normalizedProperties = [];

        if (resProps.ok) {
          const propsJson = await resProps.json();

          if (propsJson.success && Array.isArray(propsJson.data)) {
            normalizedProperties = propsJson.data;
          }
        }

        if (!mounted) return;
        setProperties(normalizedProperties);

        /* =========================
         USERS
      ========================== */
        const resUsers = await fetch(`/api/companies/${id}/members`, {
          cache: "no-store",
        });

        let normalizedUsers = [];

        if (resUsers.ok) {
          const usersJson = await resUsers.json();

          let rawMembers = [];

          if (Array.isArray(usersJson)) {
            rawMembers = usersJson;
          } else if (Array.isArray(usersJson?.members)) {
            rawMembers = usersJson.members;
          } else if (Array.isArray(usersJson?.data)) {
            rawMembers = usersJson.data;
          }

          normalizedUsers = rawMembers.map((m) => ({
            id: m.profiles?.id || m.profile?.id || m.id,
            full_name:
              m.profiles?.full_name ||
              m.profile?.full_name ||
              m.full_name ||
              "",
            email: m.profiles?.email || m.profile?.email || m.email || "",
            company_role: m.role,
          }));

          normalizedUsers.sort((a, b) =>
            a.full_name.localeCompare(b.full_name, undefined, {
              sensitivity: "base",
            }),
          );
        }

        if (!mounted) return;
        setUsers(normalizedUsers);
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

  /* =========================
     LOADING
  ========================== */
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
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500">
        <Link href="/admin/companies" className="hover:underline">
          Companies
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700 font-medium">{company.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl border bg-white shadow-sm flex items-center justify-center overflow-hidden">
            {company.logo_url ? (
              <Image
                src={company.logo_url}
                alt={`${company.name} logo`}
                width={80}
                height={80}
                className="object-contain"
              />
            ) : (
              <span className="text-2xl font-bold text-gray-700">
                {company.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <h1 className="text-4xl font-semibold tracking-tight">
              {company.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Company portfolio overview
            </p>
          </div>
        </div>

        <Link
          href={`/admin/companies/${id}/edit`}
          className="inline-flex items-center justify-center rounded-xl bg-black px-6 py-3 text-white font-medium hover:opacity-90 transition"
        >
          Edit Company
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard label="Properties" value={properties.length} />
        <StatCard label="Users" value={users.length} />
        <StatCard
          label="Created"
          value={new Date(company.created_at).toLocaleDateString()}
        />
      </div>

      {/* Company Details */}
      <Section title="Company Details">
        <Detail label="Email" value={company.email} />
        <Detail label="Phone" value={company.phone} />
        <Detail
          label="Notes"
          value={company.notes}
          emptyText="No notes added"
        />
      </Section>

      {/* Users */}
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

                <Link href={`/admin/companies/${id}/members`}>Edit →</Link>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Properties */}
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

/* UI Helpers */
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border p-8 shadow-sm space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
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
