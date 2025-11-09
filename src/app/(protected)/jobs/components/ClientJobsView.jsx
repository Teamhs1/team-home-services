"use client";

import React, { useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Loader2,
  ClipboardList,
  CalendarDays,
  List,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js"; // ✅ importamos el factory
import Link from "next/link";

export default function ClientJobsView({
  customerJobs,
  customerLoading,
  form,
  setForm,
  createCustomerJob,
  fetchCustomerJobs,
  clerkId,
  getToken, // ✅ viene desde JobsPage
  viewMode,
  setViewMode,
}) {
  // ✅ Suscripción Realtime autenticada y segura
  useEffect(() => {
    if (!clerkId) return;

    const initRealtime = async () => {
      try {
        const token = await getToken({ template: "supabase" });
        if (!token) {
          console.warn("⚠️ No Clerk token available for realtime.");
          return;
        }

        // 🔐 Crear cliente local (evita error con .auth)
        const supabaseRealtime = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        // ✅ Configurar sesión Clerk → Supabase
        await supabaseRealtime.auth.setSession({ access_token: token });

        console.log("👀 Subscribing to realtime for client:", clerkId);

        const channel = supabaseRealtime
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
              await fetchCustomerJobs?.();

              const job = payload.new;

              switch (payload.eventType) {
                case "INSERT":
                  toast.info("🧾 New cleaning scheduled!", {
                    description:
                      job?.title || "Your cleaning request was added.",
                  });
                  break;
                case "UPDATE":
                  if (job.status === "in_progress") {
                    toast.info("🧽 Your cleaning has started!", {
                      description:
                        job?.title || "A cleaner has started your job.",
                    });
                  } else if (job.status === "completed") {
                    toast.success("✨ Cleaning completed!", {
                      description: job?.title || "Your cleaning job is done!",
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
            console.log("📶 Realtime status:", status);
          });

        // ✅ Cleanup seguro
        return () => {
          console.log("❌ Unsubscribed from realtime");
          supabaseRealtime.removeChannel(channel);
        };
      } catch (err) {
        console.error("❌ Error in Realtime setup:", err.message);
      }
    };

    initRealtime();
  }, [clerkId, getToken, fetchCustomerJobs]);

  // 🧹 Render principal (sin cambios)
  return (
    <main className="px-6 md:px-12 lg:px-16 xl:px-20 py-10 max-w-[1600px] mx-auto space-y-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          🧽 My Cleaning Requests
        </h1>
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">My Requests</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="flex items-center gap-2"
            title={`Switch to ${viewMode === "grid" ? "List" : "Grid"} View`}
          >
            {viewMode === "grid" ? (
              <List className="w-4 h-4" />
            ) : (
              <LayoutGrid className="w-4 h-4" />
            )}
          </Button>
        </div>

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
                    className="border-t hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => (window.location.href = `/jobs/${job.id}`)}
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
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block group"
              >
                <Card className="hover:shadow-lg border border-border/50 transition-transform hover:scale-[1.02]">
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
                      {job.status.replace("_", " ")}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
