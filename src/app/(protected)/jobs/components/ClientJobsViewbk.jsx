"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Loader2,
  LayoutGrid,
  List,
  ClipboardList,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ClientJobsView({
  customerJobs,
  customerLoading,
  form,
  setForm,
  createCustomerJob,
  fetchCustomerJobs,
  clerkId,
}) {
  const [viewMode, setViewMode] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("viewMode") || "list"
      : "list"
  );

  useEffect(() => {
    localStorage.setItem("viewMode", viewMode);
  }, [viewMode]);

  // ✅ Suscripción Realtime a cambios del cliente
  useEffect(() => {
    if (!clerkId) return;

    console.log("👀 Listening realtime for client:", clerkId);

    const channel = supabase
      .channel(`client_jobs_${clerkId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cleaning_jobs",
          filter: `created_by=eq.${clerkId}`,
        },
        async (payload) => {
          console.log("📡 Realtime event:", payload.eventType, payload.new);

          const job = payload.new;

          // 🔄 Refrescar lista
          await fetchCustomerJobs?.();

          // 🚀 Mostrar notificación visual
          switch (payload.eventType) {
            case "INSERT":
              toast.info("🧾 New cleaning scheduled!", {
                description: job.title || "Your cleaning request was added.",
              });
              break;
            case "UPDATE":
              if (job.status === "in_progress") {
                toast.info("🧽 Your cleaning has started!", {
                  description: job.title || "A cleaner has started your job.",
                });
              } else if (job.status === "completed") {
                toast.success("✨ Cleaning completed!", {
                  description: job.title || "Your cleaning job is done!",
                });
              } else {
                toast.message("🔔 Job updated", {
                  description: `${job.title} is now ${job.status}`,
                });
              }
              break;
            case "DELETE":
              toast.warning("🗑️ A job was removed.", {
                description: job?.title || "One of your jobs was deleted.",
              });
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log("📶 Subscription status:", status);
      });

    return () => {
      console.log("❌ Unsubscribed from realtime");
      supabase.removeChannel(channel);
    };
  }, [clerkId]);

  return (
    <main className="px-6 md:px-12 lg:px-16 xl:px-20 py-10 max-w-[1600px] mx-auto space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          🧽 My Cleaning Requests
        </h1>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Formulario */}
      <Card className="border border-border/50">
        <CardHeader>
          <CardTitle>Request a Cleaning</CardTitle>
          <CardDescription>
            Submit a new cleaning request below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            className="w-full border rounded-md p-2"
            placeholder="Job title (e.g. Deep Cleaning)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            type="date"
            min={new Date().toISOString().split("T")[0]}
            className="w-full border rounded-md p-2"
            value={form.scheduled_date || ""}
            onChange={(e) =>
              setForm({ ...form, scheduled_date: e.target.value })
            }
          />
          <select
            className="w-full border rounded-md p-2 text-gray-700"
            value={form.service_type}
            onChange={(e) => setForm({ ...form, service_type: e.target.value })}
          >
            <option value="">Select service type</option>
            <option value="standard">Standard Cleaning</option>
            <option value="deep">Deep Cleaning</option>
            <option value="move-out">Move-out Cleaning</option>
            <option value="add-ons">Add-ons</option>
          </select>
          <input
            className="w-full border rounded-md p-2"
            placeholder="Property address"
            value={form.property_address}
            onChange={(e) =>
              setForm({ ...form, property_address: e.target.value })
            }
          />
          <textarea
            className="w-full border rounded-md p-2 text-sm"
            placeholder="Additional notes (optional)"
            value={form.notes || ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex justify-end mt-4">
            <Button
              disabled={
                !form.title || !form.service_type || !form.scheduled_date
              }
              onClick={createCustomerJob}
              className="px-10 py-2 text-sm font-semibold rounded-lg shadow-sm transition-transform duration-150 hover:scale-[1.03]"
            >
              {customerLoading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista o Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-3">My Requests</h2>
        {customerLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : customerJobs.length === 0 ? (
          <p className="text-gray-500 text-sm">No cleaning requests yet.</p>
        ) : viewMode === "list" ? (
          <div className="overflow-x-auto bg-white shadow rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Job</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {customerJobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-t hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-2 font-medium">{job.title}</td>
                    <td className="px-4 py-2">
                      {new Date(job.scheduled_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {job.service_type}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          job.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : job.status === "in_progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {job.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {customerJobs.map((job) => (
              <Card
                key={job.id}
                className="hover:shadow-lg border border-border/50 relative"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    {job.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    <CalendarDays className="w-4 h-4 inline mr-1" />
                    {job.scheduled_date} • {job.service_type}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-semibold ${
                      job.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : job.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {job.status}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
