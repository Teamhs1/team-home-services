"use client";
import LeasePreview from "@/components/LeasePreview";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
  MapPin,
  FileText,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function ApplicationDetailPage() {
  const [draft, setDraft] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const { id } = useParams();
  const router = useRouter();
  const [lease, setLease] = useState(null);

  const [app, setApp] = useState(null);
  const [templates, setTemplates] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const primaryBtn =
    "px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition";

  const secondaryBtn =
    "px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition";

  const tenantFields = [
    { key: "first_name", label: "First Name" },
    { key: "last_name", label: "Last Name" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
  ];

  const [step, setStep] = useState(1);
  // 🔥 AUTO SELECT TEMPLATE SEGÚN PROVINCIA
  useEffect(() => {
    if (!app || !templates?.length) return;

    const province = app.property?.province;

    if (!province) return;

    const match = templates.find(
      (t) => t.province?.toLowerCase() === province.toLowerCase(),
    );

    if (match) {
      setSelectedTemplate(match);
    }
  }, [app, templates]);

  const handleSendLease = async () => {
    try {
      if (!selectedTemplate) {
        toast.error("Select a template first");
        return;
      }

      setActionLoading(true);

      console.log("🚀 Sending lease with:", {
        application_id: id,
        template_id: selectedTemplate?.id,
      });

      const res = await fetch("/api/leases/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          application_id: id,
          template_id: selectedTemplate?.id,
          draft,
        }),
      });

      const data = await res.json();

      // 🔥 DEBUG
      console.log("📦 RESPONSE:", data);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to send lease");
      }

      toast.success("Lease generated & sent ✉️");

      // 🔥 CLAVE: mostrar PDF
      if (data?.url) {
        setLease({
          pdf_url: data.url,
        });
      } else {
        console.warn("⚠️ No URL returned from API");
      }

      fetchApplication();
    } catch (err) {
      console.error("❌ SEND LEASE ERROR:", err.message);
      toast.error(err.message || "Failed to send lease");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePreviewLease = async () => {
    try {
      if (!selectedTemplate) {
        toast.error("Select a template first");
        return;
      }

      setActionLoading(true);

      const res = await fetch("/api/leases/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          application_id: id,
          template_id: selectedTemplate?.id,
          draft,
          preview: true, // 🔥 IMPORTANTE
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to preview lease");
      }

      // 👇 SOLO mostrar PDF (no guardar)
      if (data?.url) {
        setLease({
          pdf_url: data.url,
        });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/lease-templates");
      const data = await res.json();
      setTemplates(data || []);
    } catch {
      toast.error("Failed to load templates");
    }
  };
  const handleMarkSigned = async () => {
    try {
      setActionLoading(true);

      const res = await fetch("/api/leases/sign", {
        method: "POST",
        body: JSON.stringify({ application_id: id }),
      });

      if (!res.ok) throw new Error();

      toast.success("Lease signed ✅");
      fetchApplication();
    } catch {
      toast.error("Failed to sign lease");
    } finally {
      setActionLoading(false);
    }
  };

  // 🔹 Fetch application
  const fetchApplication = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/tenant-applications/${id}`);
      const data = await res.json();

      setApp(data);
    } catch (err) {
      toast.error("Failed to load application");
    } finally {
      setLoading(false);
    }
  };
  const normalizePropertyType = (type) => {
    if (!type) return "house";

    const map = {
      apartment: "condo",
      condo: "condo",
      house: "house",
      single_family: "house",
      room: "room",
      mobile: "mobile",
    };

    return map[type] || "house";
  };

  useEffect(() => {
    if (!draft || !selectedTemplate) return;

    const timeout = setTimeout(async () => {
      try {
        setSaving(true);

        const res = await fetch("/api/leases/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            application_id: id,
            template_id: selectedTemplate?.id,
            draft,
            preview: true,
          }),
        });

        const data = await res.json();

        if (data?.url) {
          setLease({
            pdf_url: data.url,
          });
        }

        setTimeout(() => setSaving(false), 500);
      } catch (err) {
        console.error("Auto preview failed");
        setSaving(false);
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [draft, selectedTemplate]);

  useEffect(() => {
    if (id) fetchApplication();
    fetchTemplates();
  }, [id]);

  useEffect(() => {
    if (app) {
      setDraft({
        // 💰 RENT
        rent_amount: app.rent_amount || app.unit?.rent_price || "",

        // 📅 DATES
        start_date: app.start_date || new Date().toISOString().split("T")[0],

        lease_type: app.lease_type || "month_to_month",
        lease_duration: app.lease_duration || 12,

        // 👤 TENANTS
        tenants: [
          {
            first_name: app.first_name || "",
            last_name: app.last_name || "",
            phone: app.phone || "",
            email: app.email || "",
          },
        ],

        // 🏠 PROPERTY TYPE
        property_type: normalizePropertyType(
          app.property?.property_type || app.unit?.property_type,
        ),

        // ✅ CHECKBOXES
        tenant_emergency_contact: true,
        landlord_has_agent: true,
        rent_increase_allowed: false,
        security_deposit_paid: !!app.deposit_amount,

        // 🧾 ADDITIONS
        s2_smoke: "",
        s2_pets: "",
        s2_other: "",

        // 🛠 INSPECTION
        s2d_completed: true,
        s2d_date: "",
        s2d_repair: "",

        // 📍 PREMISES (AUTO FILL 🔥)
        s2_address: app.property?.address || "",
        s2_apt: app.unit?.unit || "",
        s2_city: app.property?.city || "",
        s2_postal: app.property?.postal_code || "",

        // ⚡ SERVICES (PRO)
        services: {
          water: !!app.unit?.includes_water,
          electricity: !!app.unit?.includes_electricity,
          heat: !!app.unit?.includes_heat,
        },
      });
    }
  }, [app]);
  // 🔹 Approve
  const handleApprove = async () => {
    try {
      setActionLoading(true);

      const res = await fetch("/api/tenant-applications/approve", {
        method: "POST",
        body: JSON.stringify({ application_id: id }),
      });

      if (!res.ok) throw new Error();

      toast.success("Tenant approved 🚀");
      fetchApplication();
    } catch {
      toast.error("Failed to approve");
    } finally {
      setActionLoading(false);
    }
  };

  // 🔹 Reject
  const handleReject = async () => {
    toast("Rejected (implement later)");
  };

  // 🔹 SCORE (🔥 PRO)
  const getScore = () => {
    if (!app?.income || !app?.unit?.rent_price) return null;

    const ratio = app.income / app.unit.rent_price;

    if (ratio >= 3) return { label: "Excellent", color: "text-green-500" };
    if (ratio >= 2) return { label: "Good", color: "text-yellow-500" };
    return { label: "Risky", color: "text-red-500" };
  };

  const score = getScore();

  if (loading) {
    return (
      <div className="flex justify-center py-40">
        <Loader2 className="animate-spin w-6 h-6" />
      </div>
    );
  }

  if (!app) {
    return <div className="p-10">Application not found</div>;
  }

  return (
    <div className="pt-24 px-4 max-w-[1400px] mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">
            {app.first_name} {app.last_name}
          </h1>

          <p className="text-sm text-gray-500">Application ID: {app.id}</p>

          {/* UNIT INFO */}
          <div className="mt-2 text-sm text-gray-600 space-y-1">
            {app.unit && (
              <p>
                🏠 Unit {app.unit.unit} · ${app.unit.rent_price}/mo
              </p>
            )}
            {app.property && <p>📍 {app.property.address}</p>}
            {app.company && <p>🏢 {app.company.name}</p>}
          </div>
        </div>

        {/* ACTIONS */}
        {app.status === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Approve
            </button>

            <button
              onClick={handleReject}
              className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
          </div>
        )}
      </div>
      {/* 🔥 TEMPLATE SELECT */}
      {app.status === "approved" && (
        <div className="flex gap-2 items-center">
          <select
            className="border rounded-lg px-3 py-2"
            onChange={(e) => {
              const selected = templates.find((t) => t.id === e.target.value);
              setSelectedTemplate(selected);
            }}
          >
            <option value="">
              Select Lease for {app.property?.province || "Region"}
            </option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.province || "NB"})
              </option>
            ))}
          </select>
        </div>
      )}
      {/* ================================================= */}
      {/* 🧾 STEP 1 — LEASE DETAILS + CHECKBOXES + LIVE PREVIEW */}
      {/* ================================================= */}
      {step === 1 && selectedTemplate && draft && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* ================= LEFT → FORM ================= */}
          <div className="bg-white border rounded-xl p-4 space-y-3">
            <h2 className="font-semibold">Lease Details</h2>

            {/* PROPERTY TYPE */}
            <select
              value={draft.property_type}
              onChange={(e) =>
                setDraft({ ...draft, property_type: e.target.value })
              }
              className="border px-3 py-2 rounded-lg w-full"
            >
              <option value="house">House / Apartment</option>
              <option value="condo">Condo</option>
              <option value="room">Room</option>
              <option value="mobile">Mobile</option>
            </select>

            {/* CHECKBOXES */}
            <div className="pt-2 space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.landlord_has_agent}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      landlord_has_agent: e.target.checked,
                    })
                  }
                />
                Landlord has agent
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.rent_increase_allowed}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      rent_increase_allowed: e.target.checked,
                    })
                  }
                />
                Allow rent increase
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.security_deposit_paid}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      security_deposit_paid: e.target.checked,
                    })
                  }
                />
                Security deposit paid
              </label>
              {/* 🔥 EMERGENCY CONTACT */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.tenant_emergency_contact}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      tenant_emergency_contact: e.target.checked,
                    })
                  }
                />
                Emergency contact provided
              </label>

              {/* 🔥 SERVICES */}
              <div className="pt-3 space-y-2 border-t mt-2">
                <p className="text-sm font-medium text-gray-600">
                  Services included
                </p>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.services?.water || false}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        services: {
                          ...draft.services,
                          water: e.target.checked,
                        },
                      })
                    }
                  />
                  Water
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.services?.electricity || false}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        services: {
                          ...draft.services,
                          electricity: e.target.checked,
                        },
                      })
                    }
                  />
                  Electricity
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.services?.heat || false}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        services: {
                          ...draft.services,
                          heat: e.target.checked,
                        },
                      })
                    }
                  />
                  Heat
                </label>
              </div>
            </div>

            {/* SAVING STATUS */}
            {saving ? (
              <span className="text-xs text-gray-400 animate-pulse">
                Saving changes...
              </span>
            ) : (
              <span className="text-xs text-green-500">
                All changes saved ✓
              </span>
            )}

            {/* RENT */}
            <input
              type="number"
              placeholder="Rent"
              value={draft.rent_amount}
              onChange={(e) =>
                setDraft({ ...draft, rent_amount: e.target.value })
              }
              className="border px-3 py-2 rounded-lg w-full"
            />

            {/* START DATE */}
            <input
              type="date"
              value={draft.start_date}
              onChange={(e) =>
                setDraft({ ...draft, start_date: e.target.value })
              }
              className="border px-3 py-2 rounded-lg w-full"
            />

            {/* LEASE TYPE */}
            <select
              value={draft.lease_type}
              onChange={(e) =>
                setDraft({ ...draft, lease_type: e.target.value })
              }
              className="border px-3 py-2 rounded-lg w-full"
            >
              <option value="month_to_month">Month to Month</option>
              <option value="fixed">Fixed Term</option>
            </select>

            {/* LEASE DURATION */}
            {draft.lease_type === "fixed" && (
              <input
                type="number"
                placeholder="Lease duration (months)"
                value={draft.lease_duration}
                onChange={(e) =>
                  setDraft({ ...draft, lease_duration: e.target.value })
                }
                className="border px-3 py-2 rounded-lg w-full"
              />
            )}

            {/* NEXT BUTTON */}
            <button
              onClick={() => setStep(2)}
              className={`w-full mt-2 ${primaryBtn}`}
            >
              Next →
            </button>
          </div>

          {/* ================= RIGHT → LIVE PREVIEW ================= */}
          <div className="border rounded-xl p-4 bg-gray-50">
            <h2 className="font-semibold mb-2">Live Preview</h2>

            <div className="h-[500px] overflow-y-auto">
              <LeasePreview
                template={selectedTemplate}
                application={app}
                draft={draft}
              />
            </div>
          </div>
        </div>
      )}
      {/* ================================================= */}
      {/* 👤 STEP 2 — TENANT INFO */}
      {/* ================================================= */}

      {step === 2 && draft && (
        <div className="bg-white border rounded-xl p-4 space-y-3">
          <h2 className="font-semibold">Tenant Info</h2>

          <div className="grid md:grid-cols-2 gap-3">
            <h2 className="font-semibold">Tenants</h2>

            {draft.tenants.map((tenant, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium">Tenant {index + 1}</p>

                <input
                  placeholder="First Name"
                  value={tenant.first_name}
                  onChange={(e) => {
                    const updated = [...draft.tenants];
                    updated[index].first_name = e.target.value;
                    setDraft({ ...draft, tenants: updated });
                  }}
                  className="border px-3 py-2 rounded-lg w-full"
                />

                <input
                  placeholder="Last Name"
                  value={tenant.last_name}
                  onChange={(e) => {
                    const updated = [...draft.tenants];
                    updated[index].last_name = e.target.value;
                    setDraft({ ...draft, tenants: updated });
                  }}
                  className="border px-3 py-2 rounded-lg w-full"
                />

                <input
                  placeholder="Phone"
                  value={tenant.phone}
                  onChange={(e) => {
                    const updated = [...draft.tenants];
                    updated[index].phone = e.target.value;
                    setDraft({ ...draft, tenants: updated });
                  }}
                  className="border px-3 py-2 rounded-lg w-full"
                />

                <input
                  placeholder="Email"
                  value={tenant.email}
                  onChange={(e) => {
                    const updated = [...draft.tenants];
                    updated[index].email = e.target.value;
                    setDraft({ ...draft, tenants: updated });
                  }}
                  className="border px-3 py-2 rounded-lg w-full"
                />
              </div>
            ))}

            <button
              onClick={() => {
                if (draft.tenants.length >= 3) return;

                setDraft({
                  ...draft,
                  tenants: [
                    ...draft.tenants,
                    { first_name: "", last_name: "", phone: "", email: "" },
                  ],
                });
              }}
              className="px-3 py-1 bg-gray-200 rounded"
            >
              + Add Tenant
            </button>
          </div>
          <div className="flex justify-between pt-3">
            {/* 🔙 BACK */}
            <button onClick={() => setStep(1)} className={secondaryBtn}>
              ← Back
            </button>

            {/* 🔜 NEXT */}
            <button onClick={() => setStep(3)} className={primaryBtn}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* 🏠 STEP 3 — PREMISES */}
      {/* ================================================= */}
      {step === 3 && draft && (
        <div className="bg-white border rounded-xl p-4 space-y-3">
          <h2 className="font-semibold">Premises</h2>

          <input
            placeholder="Street Address"
            value={draft.s2_address || ""}
            onChange={(e) => setDraft({ ...draft, s2_address: e.target.value })}
            className="border px-3 py-2 rounded-lg w-full"
          />

          <input
            placeholder="Apt / Unit"
            value={draft.s2_apt || ""}
            onChange={(e) => setDraft({ ...draft, s2_apt: e.target.value })}
            className="border px-3 py-2 rounded-lg w-full"
          />

          <input
            placeholder="City"
            value={draft.s2_city || ""}
            onChange={(e) => setDraft({ ...draft, s2_city: e.target.value })}
            className="border px-3 py-2 rounded-lg w-full"
          />

          <input
            placeholder="Postal Code"
            value={draft.s2_postal || ""}
            onChange={(e) => setDraft({ ...draft, s2_postal: e.target.value })}
            className="border px-3 py-2 rounded-lg w-full"
          />

          <div className="flex justify-between pt-3">
            <button onClick={() => setStep(2)} className={secondaryBtn}>
              ← Back
            </button>

            <button onClick={() => setStep(4)} className={primaryBtn}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* 🛠 STEP 4 — INSPECTION */}
      {/* ================================================= */}
      {step === 4 && draft && (
        <div className="bg-white border rounded-xl p-4 space-y-3">
          <h2 className="font-semibold">Inspection & Repairs</h2>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.s2d_completed || false}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  s2d_completed: e.target.checked,
                })
              }
            />
            Inspection completed
          </label>
          <input
            type="date"
            value={draft.s2d_date || ""}
            onChange={(e) => setDraft({ ...draft, s2d_date: e.target.value })}
            className="border px-3 py-2 rounded-lg w-full"
          />

          <textarea
            placeholder="Repairs"
            value={draft.s2d_repair || ""}
            onChange={(e) => setDraft({ ...draft, s2d_repair: e.target.value })}
            className="border px-3 py-2 rounded-lg w-full"
          />

          <div className="flex justify-between pt-3">
            <button onClick={() => setStep(3)} className={secondaryBtn}>
              ← Back
            </button>

            <button onClick={() => setStep(5)} className={primaryBtn}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* 🧾 STEP 5 — ADDITIONS */}
      {/* ================================================= */}
      {step === 5 && draft && (
        <div className="bg-white border rounded-xl p-4 space-y-3">
          <h2 className="font-semibold">Additions</h2>

          <textarea
            placeholder="Smoking rules"
            value={draft.s2_smoke || ""}
            onChange={(e) => setDraft({ ...draft, s2_smoke: e.target.value })}
            className="border px-3 py-2 rounded-lg w-full"
          />

          <textarea
            placeholder="Pets"
            value={draft.s2_pets || ""}
            onChange={(e) => setDraft({ ...draft, s2_pets: e.target.value })}
            className="border px-3 py-2 rounded-lg w-full"
          />

          <textarea
            placeholder="Other"
            value={draft.s2_other || ""}
            onChange={(e) => setDraft({ ...draft, s2_other: e.target.value })}
            className="border px-3 py-2 rounded-lg w-full"
          />

          <div className="flex justify-between pt-3">
            <button onClick={() => setStep(4)} className={secondaryBtn}>
              ← Back
            </button>

            <button onClick={() => setStep(6)} className={primaryBtn}>
              Next →
            </button>
          </div>
        </div>
      )}
      {/* ================================================= */}
      {/* 📄 STEP 6 — PREVIEW + PDF */}
      {/* ================================================= */}
      {step === 6 && app.status === "approved" && (
        <div className="space-y-4">
          {/* BOTONES */}
          <div className="flex justify-between items-center">
            {/* 🔙 BACK */}
            <button
              onClick={() => setStep(5)}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
            >
              ← Back
            </button>

            {/* 🔥 ACTION BUTTONS */}
            <div className="flex gap-2">
              {/* PREVIEW */}
              <button
                onClick={handlePreviewLease}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-900"
              >
                Preview Lease
              </button>

              {/* SEND */}
              <button
                onClick={handleSendLease}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
              >
                Send Lease
              </button>

              {/* SIGNED */}
              <button
                onClick={handleMarkSigned}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600"
              >
                Mark as Signed
              </button>
            </div>
          </div>

          {/* 🔥 PREVIEW */}
          {selectedTemplate && (
            <LeasePreview
              template={selectedTemplate}
              application={app}
              draft={draft}
            />
          )}

          {/* 🔥 PDF VIEWER */}
          {lease?.pdf_url && (
            <div className="mt-6 max-w-[1400px] mx-auto bg-white border rounded-2xl shadow-lg p-4">
              <div className="pt-24 px-4 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Lease Document</h2>

                  <div className="flex gap-2">
                    <a
                      href={lease.pdf_url}
                      target="_blank"
                      className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg"
                    >
                      Open
                    </a>

                    <button
                      onClick={async () => {
                        try {
                          setActionLoading(true);

                          // 🔥 CLAVE → clonar el draft ACTUAL (evita estado viejo)
                          const currentDraft = structuredClone(draft);

                          const res = await fetch("/api/leases/send", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              application_id: id,
                              template_id: selectedTemplate?.id,
                              draft: currentDraft, // 🔥 SIEMPRE el último
                              preview: true,
                            }),
                          });

                          const data = await res.json();

                          if (!res.ok) throw new Error(data?.error);

                          if (data?.url) {
                            const pdfRes = await fetch(data.url, {
                              cache: "no-store",
                            });

                            const blob = await pdfRes.blob();

                            const blobUrl = window.URL.createObjectURL(blob);

                            const link = document.createElement("a");
                            link.href = blobUrl;
                            link.download = "lease.pdf";
                            link.click();

                            window.URL.revokeObjectURL(blobUrl);
                          }
                        } catch (err) {
                          console.error(err);
                          toast.error("Download failed");
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                    >
                      Download
                    </button>
                  </div>
                </div>

                <div className="w-full rounded-xl overflow-hidden border bg-black">
                  <iframe
                    src={`${lease.pdf_url}#zoom=110`}
                    className="w-full h-[95vh]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GRID */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* CONTACT */}
        <div className="bg-white border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Contact</h2>

          <p className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-gray-400" />
            {app.email}
          </p>

          <p className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-gray-400" />
            {app.phone}
          </p>
        </div>

        {/* EMPLOYMENT */}
        <div className="bg-white border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Employment</h2>

          <p className="flex items-center gap-2 text-sm">
            <Briefcase className="w-4 h-4 text-gray-400" />
            {app.employer_name || "N/A"}
          </p>

          <p className="flex items-center gap-2 text-sm font-medium">
            <DollarSign className="w-4 h-4 text-green-500" />$
            {Number(app.income || 0).toLocaleString()}/mo
          </p>

          {/* SCORE */}
          {score && (
            <p className={`text-sm font-semibold ${score.color}`}>
              Score: {score.label}
            </p>
          )}
        </div>

        {/* ADDRESS */}
        <div className="bg-white border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Address</h2>

          <p className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-400" />
            {app.address || "N/A"}
          </p>

          <p className="text-sm text-gray-500">
            {app.city}, {app.province}
          </p>
        </div>

        {/* DOCUMENTS */}
        <div className="bg-white border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Documents</h2>

          {app.id_document && (
            <a
              href={app.id_document}
              target="_blank"
              className="text-sm text-blue-600 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              View ID Document
            </a>
          )}

          {app.paystubs?.length > 0 &&
            app.paystubs.map((doc, i) => (
              <a
                key={i}
                href={doc}
                target="_blank"
                className="text-sm text-blue-600 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Paystub {i + 1}
              </a>
            ))}
        </div>
      </div>
    </div>
  );
}
