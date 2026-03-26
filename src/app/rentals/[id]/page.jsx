"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import UnitSlider from "@/components/UnitSlider";
import { toast } from "sonner"; // 🔥 NUEVO

export default function RentalDetailPage() {
  const inputClass =
    "w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-primary outline-none";
  const { id } = useParams();
  const router = useRouter();

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    return data.url;
  };
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState({
    id: null,
    paystubs: [],
  });

  const handleFile = (e, type) => {
    if (type === "id") {
      setFiles({ ...files, id: e.target.files[0] });
    }

    if (type === "paystubs") {
      setFiles({ ...files, paystubs: Array.from(e.target.files) });
    }
  };
  // 🔥 APPLY STATES
  const [showApply, setShowApply] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 🔥 NUEVO

  const [appForm, setAppForm] = useState({
    // BASIC
    first_name: "",
    last_name: "",
    email: "",
    phone: "",

    // ADDRESS
    address: "",
    city: "",
    province: "",
    postal_code: "",

    // EMPLOYMENT
    employer_name: "",
    employer_phone: "",
    position: "",
    income: "",

    // LANDLORD
    landlord_name: "",
    landlord_phone: "",
    reason_for_leaving: "",
  });

  useEffect(() => {
    if (!id) return;

    async function fetchUnit() {
      try {
        const res = await fetch(`/api/rentals/${id}`, {
          cache: "no-store",
        });
        const json = await res.json();

        if (!res.ok) throw new Error();
        setUnit(json.unit);
      } catch (err) {
        console.error("Failed to load rental:", err);
        setUnit(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUnit();
  }, [id]);

  if (loading) return <div className="p-10">Loading rental…</div>;

  if (!unit) {
    return (
      <div className="p-10 text-center text-gray-500">
        Rental not found or unavailable.
      </div>
    );
  }

  const fullAddress = unit.property?.address
    ? `${unit.property.address}${
        unit.unit ? ` · Unit ${unit.unit}` : ""
      }${unit.property.postal_code ? `, ${unit.property.postal_code}` : ""}`
    : null;

  const sliderImages = (() => {
    if (!unit?.images) return [];

    if (Array.isArray(unit.images)) {
      return unit.images.filter(Boolean);
    }

    if (typeof unit.images === "string") {
      return unit.images
        .replace(/[{}"]/g, "")
        .split(",")
        .map((img) => img.trim())
        .filter(Boolean);
    }

    return [];
  })();

  // 🔥 HANDLE APPLY
  const handleSubmit = async () => {
    try {
      if (!files.id) {
        toast.error("ID is required");
        return;
      }

      setSubmitting(true);

      let idUrl = null;
      let paystubUrls = [];

      // 🔥 ID
      const idForm = new FormData();
      idForm.append("file", files.id);

      let res = await fetch("/api/upload", {
        method: "POST",
        body: idForm,
      });

      let data = await res.json();
      if (!res.ok) throw new Error(data.error);

      idUrl = data.url;

      // 🔥 PAYSTUBS
      if (files.paystubs.length > 0) {
        for (const file of files.paystubs) {
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          paystubUrls.push(data.url);
        }
      }

      console.log("FINAL DATA:", { idUrl, paystubUrls });

      // 🔥 APPLICATION
      res = await fetch("/api/tenant-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // 🔥 CLAVE
        },
        body: JSON.stringify({
          ...appForm,
          unit_id: unit.id,
          property_id: unit?.property?.id || null,
          company_id: unit?.property?.company_id || null,
          id_document: idUrl,
          paystubs: paystubUrls,
        }),
      });

      data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast.success("Application submitted 🚀");
      setShowApply(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white">
      {/* HERO */}
      <div className="relative mt-[72px]">
        <UnitSlider images={sliderImages} height={420} />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        {/* BACK */}
        <div className="pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 text-gray-600 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to listings
          </Button>
        </div>

        {/* INFO BAR */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border rounded-xl p-5 bg-white shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-primary" />
            {fullAddress || "Address not available"}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-primary" />
              {unit.available_from
                ? new Date(unit.available_from).toLocaleDateString()
                : "Available now"}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-primary">
                  ${Number(unit.rent_price).toLocaleString()}
                </span>
                <span className="text-sm text-gray-500">/ month</span>
              </div>

              {/* 🔥 APPLY BUTTON */}
              <Button onClick={() => setShowApply(true)}>Apply Now</Button>
            </div>
          </div>
        </div>

        {/* FEATURES */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-primary">
            Key Features
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Feature label={`${unit.bedrooms ?? "—"} Beds`} />
            <Feature label={`${unit.bathrooms ?? "—"} Bath`} />
            <Feature label={`${unit.square_feet ?? "—"} sqft`} />
            <Feature label={unit.type || "Apartment"} />
          </div>
        </section>

        {/* DESCRIPTION */}
        <section>
          <h2 className="text-lg font-semibold mb-3 text-primary">
            What’s Special
          </h2>

          <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-700">
            {unit.description || "No description provided."}
          </div>
        </section>

        {/* MAP */}
        <section>
          <h2 className="text-lg font-semibold mb-3 text-primary">
            Find on Map
          </h2>

          {fullAddress && (
            <iframe
              className="w-full h-[320px] rounded-xl border"
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                fullAddress,
              )}&output=embed`}
            />
          )}
        </section>
      </div>

      {/* 🔥 APPLY MODAL */}
      {showApply && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg space-y-5">
            <h2 className="text-lg font-semibold">Apply for this Unit</h2>
            {/* 🔥 CONTEXT INFO (clean UI) */}
            <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-800">
                Applying for
              </p>

              <div className="text-sm text-gray-600 space-y-1">
                <p className="flex items-center gap-2">
                  🏠 <span>Unit {unit?.unit || "—"}</span>
                  <span className="text-gray-400">·</span>
                  <span className="font-medium text-primary">
                    ${Number(unit?.rent_price || 0).toLocaleString()}/mo
                  </span>
                </p>

                <p className="flex items-center gap-2">
                  📍{" "}
                  <span>
                    {unit?.property?.address || "Address unavailable"}
                  </span>
                </p>
              </div>

              {/* 🔥 opcional: debug pequeño */}
              <div className="text-[10px] text-gray-400 pt-2 border-t">
                ID: {unit?.id?.slice(0, 6)} · Property:{" "}
                {unit?.property?.id?.slice(0, 6) || "—"}
              </div>
            </div>
            {/* STEP BAR */}
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full ${
                    step >= s ? "bg-primary" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>

            {/* STEP 1 - BASIC */}
            {step === 1 && (
              <>
                <input
                  placeholder="First Name"
                  className={inputClass}
                  value={appForm.first_name}
                  onChange={(e) =>
                    setAppForm({ ...appForm, first_name: e.target.value })
                  }
                />

                <input
                  placeholder="Last Name"
                  className={inputClass}
                  value={appForm.last_name}
                  onChange={(e) =>
                    setAppForm({ ...appForm, last_name: e.target.value })
                  }
                />

                <input
                  placeholder="Email"
                  className={inputClass}
                  value={appForm.email}
                  onChange={(e) =>
                    setAppForm({ ...appForm, email: e.target.value })
                  }
                />

                <input
                  placeholder="Phone"
                  className={inputClass}
                  value={appForm.phone}
                  onChange={(e) =>
                    setAppForm({ ...appForm, phone: e.target.value })
                  }
                />
              </>
            )}

            {/* STEP 2 - ADDRESS */}
            {step === 2 && (
              <>
                <input
                  placeholder="Address"
                  className={inputClass}
                  value={appForm.address}
                  onChange={(e) =>
                    setAppForm({ ...appForm, address: e.target.value })
                  }
                />

                <input
                  placeholder="City"
                  className={inputClass}
                  value={appForm.city}
                  onChange={(e) =>
                    setAppForm({ ...appForm, city: e.target.value })
                  }
                />

                <input
                  placeholder="Province"
                  className={inputClass}
                  value={appForm.province}
                  onChange={(e) =>
                    setAppForm({ ...appForm, province: e.target.value })
                  }
                />

                <input
                  placeholder="Postal Code"
                  className={inputClass}
                  value={appForm.postal_code}
                  onChange={(e) =>
                    setAppForm({ ...appForm, postal_code: e.target.value })
                  }
                />
              </>
            )}

            {/* STEP 3 - EMPLOYMENT */}
            {step === 3 && (
              <>
                <input
                  placeholder="Employer Name"
                  className={inputClass}
                  value={appForm.employer_name}
                  onChange={(e) =>
                    setAppForm({ ...appForm, employer_name: e.target.value })
                  }
                />

                <input
                  placeholder="Position"
                  className={inputClass}
                  value={appForm.position}
                  onChange={(e) =>
                    setAppForm({ ...appForm, position: e.target.value })
                  }
                />

                <input
                  placeholder="Monthly Income"
                  className={inputClass}
                  value={appForm.income}
                  onChange={(e) =>
                    setAppForm({ ...appForm, income: e.target.value })
                  }
                />

                <input
                  placeholder="Employer Phone"
                  className={inputClass}
                  value={appForm.employer_phone}
                  onChange={(e) =>
                    setAppForm({ ...appForm, employer_phone: e.target.value })
                  }
                />
              </>
            )}

            {/* STEP 4 - LANDLORD + DOCUMENTS */}
            {step === 4 && (
              <>
                {/* LANDLORD INFO */}
                <input
                  placeholder="Landlord Name"
                  className={inputClass}
                  value={appForm.landlord_name}
                  onChange={(e) =>
                    setAppForm({ ...appForm, landlord_name: e.target.value })
                  }
                />

                <input
                  placeholder="Landlord Phone"
                  className={inputClass}
                  value={appForm.landlord_phone}
                  onChange={(e) =>
                    setAppForm({ ...appForm, landlord_phone: e.target.value })
                  }
                />

                <input
                  placeholder="Reason for leaving"
                  className={inputClass}
                  value={appForm.reason_for_leaving}
                  onChange={(e) =>
                    setAppForm({
                      ...appForm,
                      reason_for_leaving: e.target.value,
                    })
                  }
                />

                {/* 🔥 DOCUMENT UPLOAD */}
                <div className="space-y-3 mt-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Upload ID (required)
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFile(e, "id")}
                      className="w-full text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Upload Paystubs
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFile(e, "paystubs")}
                      className="w-full text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            {/* BUTTONS */}
            <div className="flex gap-2">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="w-full border py-2 rounded-lg"
                >
                  Back
                </button>
              )}

              {step < 4 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="w-full bg-primary text-white py-2 rounded-lg"
                >
                  Next
                </button>
              ) : (
                <button
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="w-full bg-primary text-white py-2 rounded-lg"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Feature({ label }) {
  return (
    <div className="flex items-center justify-center rounded-lg border bg-gray-50 py-4 text-sm font-medium text-gray-700">
      {label}
    </div>
  );
}
