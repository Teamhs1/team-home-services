"use client";
import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useCustomerJobs } from "../hooks/useCustomerJobs";
import { toast } from "sonner";

export default function ClientJobRequests({ clerkId, getToken }) {
  const { jobs, loading, fetchCustomerJobs, createJobRequest } =
    useCustomerJobs({ clerkId, getToken });

  const [estimatedDuration, setEstimatedDuration] = useState(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [hallwayOptions, setHallwayOptions] = useState([]);

  /* =========================
     SERVICE TYPES (dynamic)
  ========================= */
  const [serviceTypes, setServiceTypes] = useState([]);
  const [serviceLoading, setServiceLoading] = useState(true);

  /* =========================
     FORM STATE
  ========================= */
  const [form, setForm] = useState({
    title: "",
    service_type: "",
    property_address: "",
    scheduled_date: "",
    notes: "",
    bedrooms: 2,
    bathrooms: 1,
    unit_type: "apartment",
    floors: 1,
  });
  const isHallway = form.service_type?.toLowerCase().includes("hallway");
  // Opciones válidas para el servicio seleccionado
  const validHallwayOptions = useMemo(() => {
    if (!isHallway) return [];

    return hallwayOptions.filter(
      (opt) =>
        opt.service_type?.toLowerCase().trim() ===
        form.service_type?.toLowerCase().trim(),
    );
  }, [hallwayOptions, form.service_type, isHallway]);

  // Floors disponibles según DB
  const availableFloors = useMemo(() => {
    return [...new Set(validHallwayOptions.map((o) => o.floors))];
  }, [validHallwayOptions]);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchHallwayOptions() {
      const res = await fetch("/api/hallway-options");
      const data = await res.json();
      setHallwayOptions(data || []);
    }

    fetchHallwayOptions();
  }, []);

  useEffect(() => {
    if (!form.service_type) {
      setEstimatedDuration(null);
      return;
    }

    // Para hallway: no calcular si faltan datos
    if (isHallway && !form.floors) {
      setEstimatedDuration(null);
      return;
    }

    async function getEstimate() {
      try {
        setEstimateLoading(true);
        setEstimatedDuration(null);

        // 🔥 recalcular aquí mismo si es hallway
        const hallwayCheck = form.service_type
          ?.toLowerCase()
          .includes("hallway");

        const payload = {
          service_type: form.service_type,
          bedrooms: hallwayCheck ? null : Number(form.bedrooms) || 2,
          bathrooms: hallwayCheck ? null : Number(form.bathrooms) || 1,
          unit_type: hallwayCheck ? null : form.unit_type || "apartment",
          floors: hallwayCheck ? Number(form.floors) : null,
        };

        console.log("SENDING TO API:", payload);

        const res = await fetch("/api/duration-estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        console.log("API RESPONSE:", data);

        setEstimatedDuration(data?.hours ?? null);
      } catch (err) {
        console.error("Estimate error:", err);
        setEstimatedDuration(null);
      } finally {
        setEstimateLoading(false);
      }
    }

    getEstimate();
  }, [
    form.service_type,
    form.bedrooms,
    form.bathrooms,
    form.unit_type,
    form.floors,
  ]);
  /* =========================
     LOAD JOBS
  ========================= */
  useEffect(() => {
    fetchCustomerJobs();
  }, [fetchCustomerJobs]);

  const emitJobCreated = (job) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("job:created", { detail: job }));
    }
  };

  /* =========================
     HELPERS
  ========================= */
  const getServiceName = (value) => {
    const found = serviceTypes.find((t) => t.value === value);
    return found?.name || value?.replaceAll("_", " ");
  };

  /* =========================
     HANDLERS
  ========================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.title?.trim() || !form.service_type || !form.scheduled_date) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      setSubmitting(true);

      const createdJob = await createJobRequest({
        title: form.title.trim(),
        property_address: form.property_address?.trim() || form.title.trim(),
        service_type: form.service_type,
        scheduled_date: form.scheduled_date,
        notes: form.notes || null,
      });

      if (createdJob?.id) {
        emitJobCreated(createdJob);
        fetchCustomerJobs();
      }

      setForm({
        title: "",
        service_type: "",
        property_address: "",
        scheduled_date: "",
        notes: "",
      });

      toast.success("✅ Cleaning request submitted!");
    } catch (err) {
      toast.error("Error creating request: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     LOADING STATE
  ========================= */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Request a Cleaning Service</CardTitle>
          <CardDescription>
            Tell us what you need and when you’d like it done.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <input
            name="title"
            className="w-full border rounded-lg p-2 text-sm"
            placeholder="Unit or Reference (e.g. Unit 10)"
            value={form.title}
            onChange={handleChange}
          />

          <select
            name="service_type"
            value={form.service_type}
            onChange={(e) => {
              const newService = e.target.value;

              setForm((prev) => ({
                ...prev,
                service_type: newService,
                floors: "",
              }));
            }}
            className="w-full border rounded-lg p-2 text-sm"
            disabled={serviceLoading}
          >
            <option value="">
              {serviceLoading ? "Loading services..." : "Select service type"}
            </option>

            {serviceTypes.map((type) => (
              <option key={type.id} value={type.value}>
                {type.name}
              </option>
            ))}
          </select>
          {/* Property Details */}
          {isHallway && (
            <div className="grid md:grid-cols-1 grid-cols-1 gap-3">
              <select
                name="floors"
                value={form.floors}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    floors: e.target.value,
                  }))
                }
                className="border rounded-lg p-2 text-sm"
              >
                <option value="">Select number of levels</option>

                {availableFloors.map((floor) => (
                  <option key={floor} value={floor}>
                    {floor} {floor > 1 ? "Levels" : "Level"}
                  </option>
                ))}
              </select>
            </div>
          )}
          <p className="text-xs text-red-500">
            DEBUG: {form.service_type || "EMPTY"}
          </p>
          {form.service_type && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              {estimateLoading ? (
                <p className="text-sm text-blue-600">Calculating...</p>
              ) : (
                <p className="text-sm font-semibold text-blue-700">
                  ⏱ Estimated duration: {estimatedDuration ?? "Not found"}
                </p>
              )}
            </div>
          )}
          <input
            name="property_address"
            className="w-full border rounded-lg p-2 text-sm"
            placeholder="Property Address (optional)"
            value={form.property_address}
            onChange={handleChange}
          />

          <input
            name="scheduled_date"
            type="date"
            className="w-full border rounded-lg p-2 text-sm"
            value={form.scheduled_date}
            onChange={handleChange}
          />

          <textarea
            name="notes"
            className="w-full border rounded-lg p-2 text-sm"
            placeholder="Additional notes (optional)"
            value={form.notes}
            onChange={handleChange}
          />

          <Button
            disabled={
              submitting ||
              !form.title ||
              !form.service_type ||
              !form.scheduled_date
            }
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-3">My Requests</h2>

        {jobs.length === 0 ? (
          <p className="text-gray-500 text-sm">No requests yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 grid-cols-1 gap-4">
            {jobs.map((job) => (
              <Card key={job.id} className="border">
                <CardHeader>
                  <CardTitle>{job.title}</CardTitle>
                  <CardDescription>
                    {getServiceName(job.service_type) || "No service type"}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <p className="text-gray-500 text-sm">
                    📍 {job.property_address || "No address"}
                  </p>

                  <p className="text-gray-500 text-xs mt-1">
                    🗓️{" "}
                    {job.scheduled_date
                      ? new Date(job.scheduled_date).toLocaleDateString()
                      : "No date"}
                  </p>

                  <p
                    className={`mt-2 text-xs px-2 py-1 rounded-full font-semibold inline-block ${
                      job.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : job.status === "in_progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {job.status?.replaceAll("_", " ") || "pending"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
