"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

/* =====================
   ROLE BADGE
===================== */
function RoleBadge({ role }) {
  const styles =
    role === "client"
      ? "bg-blue-600/10 text-blue-600"
      : "bg-green-600/10 text-green-600";

  return (
    <span className={`text-xs px-2 py-1 rounded-full capitalize ${styles}`}>
      {role}
    </span>
  );
}

export default function CompanyMembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [meRole, setMeRole] = useState(null);
  const [meProfileId, setMeProfileId] = useState(null);

  /* =====================
     LOAD MEMBERS + ME
  ===================== */
  useEffect(() => {
    async function loadData() {
      try {
        // 👤 yo
        const meRes = await fetch("/api/me", { cache: "no-store" });
        const me = await meRes.json();

        setMeRole(me.role);
        setMeProfileId(me.profile_id);

        // 👥 members
        const res = await fetch("/api/company/members", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to load members");
        }

        const data = await res.json();
        setMembers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        toast.error(err.message);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <div className="p-6">Loading members…</div>;
  }

  /* =====================
     RENDER
  ===================== */
  return (
    <section className="mt-20 p-6 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Company Members</h1>
        <p className="text-muted-foreground mt-1">
          Manage people and their roles inside your company.
        </p>
      </header>

      {members.length === 0 ? (
        <p className="text-muted-foreground">No members found.</p>
      ) : (
        <div className="space-y-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between border rounded-lg px-4 py-3"
            >
              {/* INFO */}
              <div>
                <p className="font-medium">{m.full_name}</p>
                <p className="text-sm text-muted-foreground">{m.email}</p>
              </div>

              {/* ROLE */}
              <div className="flex items-center gap-3">
                <RoleBadge role={m.role} />

                {/* 🔑 solo client puede cambiar y no a sí mismo */}
                {meRole === "client" && meProfileId !== m.profile_id && (
                  <select
                    value={m.role}
                    onChange={async (e) => {
                      const newRole = e.target.value;

                      try {
                        const res = await fetch("/api/company/members/role", {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            member_profile_id: m.profile_id,
                            role: newRole,
                          }),
                        });

                        const json = await res.json();
                        if (!res.ok) {
                          throw new Error(json.error || "Update failed");
                        }

                        toast.success("Role updated");

                        // 🔄 actualizar estado local
                        setMembers((prev) =>
                          prev.map((x) =>
                            x.profile_id === m.profile_id
                              ? { ...x, role: newRole }
                              : x,
                          ),
                        );
                      } catch (err) {
                        toast.error(err.message);
                      }
                    }}
                    className="text-xs border rounded px-2 py-1 bg-background"
                  >
                    <option value="client">Client</option>
                    <option value="staff">Staff</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
