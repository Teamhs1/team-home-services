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

  const [form, setForm] = useState({
    title: "",
    service_type: "",
    property_address: "",
    scheduled_date: "",
    notes: "",
  });

  useEffect(() => {
    fetchCustomerJobs();
  }, [fetchCustomerJobs]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.scheduled_date) {
      toast.error("Please provide a title and a scheduled date.");
      return;
    }

    try {
      await createJobRequest(form);
      setForm({
        title: "",
        service_type: "",
        property_address: "",
        scheduled_date: "",
        notes: "",
      });
    } catch (err) {
      toast.error("Error creating request: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 🔹 Nueva solicitud */}
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
            placeholder="Title (e.g. Deep Cleaning)"
            value={form.title}
            onChange={handleChange}
          />

          <input
            name="scheduled_date"
            type="date"
            className="w-full border rounded-lg p-2 text-sm"
            value={form.scheduled_date}
            onChange={(e) =>
              setForm({ ...form, scheduled_date: e.target.value })
            }
          />

          <input
            name="service_type"
            className="w-full border rounded-lg p-2 text-sm"
            placeholder="Service Type (e.g. Bathroom, Kitchen)"
            value={form.service_type}
            onChange={handleChange}
          />

          <input
            name="property_address"
            className="w-full border rounded-lg p-2 text-sm"
            placeholder="Property Address"
            value={form.property_address}
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
            disabled={!form.title || !form.scheduled_date}
            onClick={handleSubmit}
            className="w-full"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </CardContent>
      </Card>

      {/* 🔹 Lista de solicitudes */}
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
