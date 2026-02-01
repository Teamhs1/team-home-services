"use client";
import PropertyMap from "@/components/PropertyMap";
import { useUser } from "@clerk/nextjs";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Building2,
  MapPin,
  Home,
  KeyRound,
  Plus,
  ArrowLeft,
  Pencil,
} from "lucide-react";

/* =====================
   HELPERS
===================== */

const getStatusStyles = (status) => {
  switch (status) {
    case "available":
      return "bg-green-100 text-green-700";
    case "assigned":
      return "bg-yellow-100 text-yellow-700";
    case "missing":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [keys, setKeys] = useState([]);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState("");
  const [postalDraft, setPostalDraft] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [savingDescription, setSavingDescription] = useState(false);

  /* =====================
     LOAD PROPERTY DATA
  ===================== */
  useEffect(() => {
    if (!id) return;

    async function loadProperty() {
      try {
        const res = await fetch(`/api/admin/properties/${id}`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to load property");
        }

        const data = await res.json();
        setProperty(data.property);
        setDescriptionDraft(data.property?.description || "");

        setProperty(data.property);
        setNameDraft(data.property?.name || "");
        setAddressDraft(data.property?.address || "");
        setPostalDraft(data.property?.postal_code || "");
        setUnits(data.units || []);
        setKeys(data.keys || []);
      } catch (err) {
        console.error("❌ Load property error:", err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="p-10 pt-[130px] text-center text-gray-500">
        Loading property…
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-10 pt-[130px] text-center text-red-600">
        Property not found
      </div>
    );
  }
  async function saveName() {
    if (!nameDraft.trim() || nameDraft === property.name) {
      setIsEditingName(false);
      return;
    }

    try {
      setSavingName(true);

      const res = await fetch(`/api/admin/properties/${property.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: nameDraft,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      // 🔥 actualiza UI sin recargar
      setProperty((prev) => ({
        ...prev,
        name: nameDraft,
      }));

      setIsEditingName(false);
    } catch (err) {
      console.error(err);
      setNameDraft(property.name); // rollback
      alert(err.message || "Failed to update property name");
    } finally {
      setSavingName(false);
    }
  }
  async function saveAddress() {
    if (
      addressDraft === property.address &&
      postalDraft === property.postal_code
    ) {
      setIsEditingAddress(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/properties/${property.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          address: addressDraft,
          postal_code: postalDraft || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      // 🔥 Actualiza UI sin recargar
      setProperty((prev) => ({
        ...prev,
        address: addressDraft,
        postal_code: postalDraft,
      }));

      setIsEditingAddress(false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update address");

      // rollback
      setAddressDraft(property.address);
      setPostalDraft(property.postal_code || "");
    }
  }
  async function saveDescription() {
    if (descriptionDraft === property.description) {
      setIsEditingDescription(false);
      return;
    }

    try {
      setSavingDescription(true);

      const res = await fetch(`/api/admin/properties/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          description: descriptionDraft,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setProperty((prev) => ({
        ...prev,
        description: descriptionDraft,
      }));

      setIsEditingDescription(false);
    } catch (err) {
      console.error(err);
      setDescriptionDraft(property.description || "");
      alert("Failed to update description");
    } finally {
      setSavingDescription(false);
    }
  }

  return (
    <div className="p-8 pt-[130px] space-y-8 max-w-[1400px] mx-auto">
      {/* BACK */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          {/* NAME (INLINE EDITABLE) */}
          <div className="flex items-center gap-2 group">
            <Building2 className="text-primary" />

            {isEditingName ? (
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") {
                    setNameDraft(property.name);
                    setIsEditingName(false);
                  }
                }}
                disabled={savingName}
                className="text-3xl font-bold border-b border-gray-300 focus:outline-none focus:border-primary bg-transparent"
              />
            ) : (
              <>
                <h1
                  onClick={() => setIsEditingName(true)}
                  className="text-3xl font-bold cursor-text hover:text-primary"
                >
                  {property.name}
                </h1>

                <button
                  onClick={() => setIsEditingName(true)}
                  className="opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-primary"
                >
                  <Pencil size={18} />
                </button>
              </>
            )}
          </div>

          {/* ADDRESS */}
          <div className="mt-2 flex items-start gap-2 group text-gray-700">
            <MapPin size={16} className="text-primary mt-1" />

            {isEditingAddress ? (
              <div className="flex flex-col gap-1">
                <input
                  autoFocus
                  value={addressDraft}
                  onChange={(e) => setAddressDraft(e.target.value)}
                  placeholder="Address"
                  className="border-b border-gray-300 bg-transparent focus:outline-none focus:border-primary"
                />

                <input
                  value={postalDraft}
                  onChange={(e) => setPostalDraft(e.target.value)}
                  placeholder="Postal code"
                  className="border-b border-gray-300 bg-transparent focus:outline-none focus:border-primary text-sm"
                />

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={saveAddress}
                    className="px-4 py-1.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 shadow-sm"
                  >
                    Save changes
                  </button>

                  <button
                    onClick={() => {
                      setAddressDraft(property.address);
                      setPostalDraft(property.postal_code || "");
                      setIsEditingAddress(false);
                    }}
                    className="px-4 py-1.5 rounded-md border text-sm text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <span className="text-base font-medium">
                  {property.address}
                  {property.postal_code && (
                    <span className="ml-2 font-semibold text-gray-900">
                      {property.postal_code}
                    </span>
                  )}
                </span>

                {isAdmin && (
                  <button
                    onClick={() => setIsEditingAddress(true)}
                    className="opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-primary"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </>
            )}
          </div>
          {/* DESCRIPTION */}
          <div className="mt-4 group">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">Description</p>

              {isAdmin && !isEditingDescription && (
                <button
                  onClick={() => setIsEditingDescription(true)}
                  className="opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-primary"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>

            {isEditingDescription ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={descriptionDraft}
                  onChange={(e) => setDescriptionDraft(e.target.value)}
                  rows={4}
                  placeholder="Describe this property (shown in rentals)"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <div className="flex gap-2">
                  <button
                    onClick={saveDescription}
                    disabled={savingDescription}
                    className="px-4 py-1.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => {
                      setDescriptionDraft(property.description || "");
                      setIsEditingDescription(false);
                    }}
                    className="px-4 py-1.5 rounded-md border text-sm text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-gray-700 text-sm whitespace-pre-line">
                {property.description || "No description provided."}
              </p>
            )}
          </div>

          {/* OWNER */}
          {property.owner ? (
            <div className="mt-1 text-sm text-gray-600 flex items-center gap-2">
              <span className="font-medium">Owner:</span>

              <button
                onClick={() =>
                  router.push(`/admin/owners/${property.owner.id}`)
                }
                className="text-primary hover:underline"
              >
                {property.owner.full_name}
              </button>

              {property.owner.email && (
                <span className="text-gray-400">· {property.owner.email}</span>
              )}

              {isAdmin && (
                <button
                  onClick={() =>
                    router.push(`/admin/properties/${property.id}/assign-owner`)
                  }
                  className="ml-2 text-xs text-gray-400 hover:text-primary underline"
                >
                  change
                </button>
              )}
            </div>
          ) : (
            isAdmin && (
              <button
                onClick={() =>
                  router.push(`/admin/properties/${property.id}/assign-owner`)
                }
                className="mt-1 text-sm text-primary underline"
              >
                Assign owner
              </button>
            )
          )}

          {/* COMPANY */}
          {property.company?.name && (
            <p className="text-sm text-gray-500 mt-1">
              Company: {property.company.name}
            </p>
          )}
        </div>

        {/* BUILT YEAR */}
        {isAdmin ? (
          <div className="mt-2 text-sm text-gray-600">
            Built{" "}
            <input
              type="number"
              value={property.year_built ?? ""}
              onChange={(e) =>
                setProperty((p) => ({
                  ...p,
                  year_built: e.target.value ? Number(e.target.value) : null,
                }))
              }
              onBlur={async () => {
                await fetch(`/api/admin/properties/${property.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    year_built: property.year_built,
                  }),
                });
              }}
              className="ml-2 w-24 border-b border-gray-300 bg-transparent focus:outline-none focus:border-primary"
              placeholder="Year"
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-600">
            Built {property.year_built ?? "—"}
          </p>
        )}
      </div>
      {/* ACTION BUTTONS */}
      {isAdmin && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              router.push(`/admin/properties/${property.id}/units/create`)
            }
            className="flex items-center gap-2 border px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            <Plus size={16} /> Add Unit
          </button>

          <button
            onClick={() =>
              router.push(`/admin/keys/create?property_id=${property.id}`)
            }
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            <Plus size={16} /> Add Key
          </button>
          <button
            onClick={async () => {
              const confirmed = confirm(
                "⚠️ This will permanently delete this property.\n\nAll units, keys and related data will be removed.\n\nThis action CANNOT be undone.\n\nDo you want to continue?",
              );

              if (!confirmed) return;

              try {
                const res = await fetch(
                  `/api/admin/properties/${property.id}`,
                  {
                    method: "DELETE",
                    credentials: "include",
                  },
                );

                const json = await res.json();
                if (!res.ok) throw new Error(json.error);

                alert("✅ Property deleted successfully");
                router.push("/admin/properties");
              } catch (err) {
                alert(err.message || "Failed to delete property");
              }
            }}
            className="flex items-center gap-2 border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50"
          >
            🗑️ Delete Property
          </button>
        </div>
      )}

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border rounded-xl p-4 bg-white">
          <p className="text-sm text-gray-500">Units</p>
          <p className="text-2xl font-bold">{units.length}</p>
        </div>

        <div className="border rounded-xl p-4 bg-white">
          <p className="text-sm text-gray-500">Keys</p>
          <p className="text-2xl font-bold">{keys.length}</p>
        </div>

        <div className="border rounded-xl p-4 bg-white">
          <p className="text-sm text-gray-500">Company</p>
          <p className="font-medium">{property.company?.name || "—"}</p>
        </div>
      </div>
      {/* LOCATION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MapPin size={18} /> Location
          </h2>

          {isAdmin && (
            <button
              onClick={() =>
                router.push(`/admin/properties/${property.id}/set-location`)
              }
              className="flex items-center gap-2 border px-3 py-1.5 rounded-md text-sm hover:bg-gray-50"
            >
              <MapPin size={14} />
              Set location
            </button>
          )}
        </div>

        <PropertyMap lat={property.latitude} lng={property.longitude} />
      </section>

      {/* UNITS */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Home size={18} /> Units
        </h2>

        {units.length === 0 ? (
          <div className="text-gray-500">This property has no units.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {units.map((u) => (
              <button
                key={u.id}
                onClick={() =>
                  router.push(`/admin/properties/${property.id}/units/${u.id}`)
                }
                className="text-left border rounded-xl p-4 bg-white hover:shadow-md hover:border-primary transition"
              >
                <p className="font-medium">Unit {u.unit}</p>

                {u.type && (
                  <p className="text-sm text-gray-500 capitalize">{u.type}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* KEYS */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <KeyRound size={18} /> Keys
        </h2>

        {keys.length === 0 ? (
          <div className="text-gray-500">
            No keys assigned to this property.
          </div>
        ) : (
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Tag</th>
                  <th className="px-4 py-3 text-left">Unit</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr
                    key={k.id}
                    onClick={() => router.push(`/admin/keys/${k.tag_code}`)}
                    className={`border-t hover:bg-gray-50 cursor-pointer ${
                      k.is_reported ? "bg-red-50" : ""
                    }`}
                  >
                    <td className="px-4 py-2 font-medium">{k.tag_code}</td>
                    <td className="px-4 py-2">{k.unit || "—"}</td>
                    <td className="px-4 py-2">{k.type || "—"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getStatusStyles(
                          k.status,
                        )}`}
                      >
                        {k.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
