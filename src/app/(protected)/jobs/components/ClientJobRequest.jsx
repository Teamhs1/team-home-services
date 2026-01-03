"use client";
import { useEffect, useState } from "react";
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

  // 🔹 FORM STATE
  const [form, setForm] = useState({
    title: "",
    service_type: "",
    property_address: "",
    scheduled_date: "",
    notes: "",
  });

  // 🔹 SUBMIT STATE (NO MEZCLAR CON FETCH)
  const [submitting, setSubmitting] = useState(false);

  /* =========================
     LOAD JOBS
  ========================= */
  useEffect(() => {
    fetchCustomerJobs();
  }, [fetchCustomerJobs]);

  // 🔔 EVENTO GLOBAL (admin escucha esto)
  const emitJobCreated = (job) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("job:created", { detail: job }));
    }
  };

  /* =========================
     FORM HANDLERS
  ========================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (
      !form.title?.trim() ||
      !form.service_type?.trim() ||
      !form.scheduled_date
    ) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      setSubmitting(true);

      const createdJob = await createJobRequest({
        ...form,
        property_address: form.property_address?.trim() || form.title.trim(),
      });

      if (createdJob?.id) {
        emitJobCreated(createdJob);
        fetchCustomerJobs(); // opcional pero seguro
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
     LOADING STATE (FETCH)
  ========================= */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="space-y-8">
      {/* 🔹 NEW REQUEST */}
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
            placeholder="Title (e.g. 44 Cameron #10)"
            value={form.title}
            onChange={handleChange}
          />

          <select
            name="service_type"
            value={form.service_type}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 text-sm"
          >
            <option value="">Select service type</option>
            <option value="standard">Standard Cleaning</option>
            <option value="deep">Deep Cleaning</option>
            <option value="move-out">Move-out Cleaning</option>
          </select>

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
            className="w-full"
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </CardContent>
      </Card>

      {/* 🔹 JOB LIST */}
      <div>
        <h2 className="text-xl font-semibold mb-3">My Requests</h2>

        {jobs.length === 0 ? (
          <p className="text-gray-500 text-sm">No requests yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <Card key={job.id} className="border">
                <CardHeader>
                  <CardTitle>{job.title}</CardTitle>
                  <CardDescription>
                    {job.service_type || "No service type"}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <p className="text-gray-500 text-sm">
                    📍 {job.property_address || "No address"}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    🗓️ {job.scheduled_date}
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
                    {job.status || "pending"}
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
