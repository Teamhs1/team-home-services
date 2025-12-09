"use client";

import React, { useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  Loader2,
  ClipboardList,
  CalendarDays,
  List,
  LayoutGrid,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// ⭐ IMPORTANTE → Slider igual que Admin
import Slider from "@/components/Slider";

export default function ClientJobsView({
  customerJobs,
  customerLoading,
  form,
  setForm,
  createCustomerJob,
  handleRealtimeUpdate,
  clerkId,
  getToken,
  viewMode,
  setViewMode,
}) {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "all";

  // ⭐ Forzar GRID en móviles
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setViewMode("grid");
    }
  }, [setViewMode]);

  // ⭐ Friendly Display Name
  const getFriendlyName = (type) => {
    if (type === "deep") return "Deep Cleaning";
    if (type === "standard") return "Standard Cleaning";
    if (type === "move-out") return "Move-out Cleaning";
    return type;
  };

  // ⭐ Realtime Updates
  useEffect(() => {
    if (!clerkId) return;

    const initRealtime = async () => {
      try {
        const token = await getToken({ template: "supabase" });
        if (!token) return;

        const supabaseRealtime = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        await supabaseRealtime.auth.setSession({ access_token: token });

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
            (payload) => {
              const { eventType, new: newJob, old: oldJob } = payload;
              if (eventType === "INSERT" || eventType === "UPDATE") {
                handleRealtimeUpdate?.(newJob);
              } else if (eventType === "DELETE") {
                handleRealtimeUpdate?.({ ...oldJob, deleted: true });
              }
            }
          )
          .subscribe();

        return () => supabaseRealtime.removeChannel(channel);
      } catch (err) {
        console.error("❌ Error initializing Client Realtime:", err);
      }
    };

    initRealtime();
  }, [clerkId, getToken, handleRealtimeUpdate]);

  // ⭐ Remove duplicates
  const uniqueJobs = Array.from(
    new Map(customerJobs.map((j) => [j.id, j])).values()
  );

  const filteredJobs =
    status === "all"
      ? uniqueJobs
      : uniqueJobs.filter((job) => job.status === status);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  return (
    <main className="px-6 md:px-12 lg:px-16 xl:px-20 py-10 max-w-[1600px] mx-auto space-y-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold">🧽 My Cleaning Requests</h1>
      </div>

      {/* ⭐ FORM REQUEST */}
      <Card className="border border-border/50 shadow-md">
        <CardHeader>
          <CardTitle>Request a Cleaning</CardTitle>
          <CardDescription>
            Fill out the form below to request a cleaning.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium block mb-1">
                Cleaning Title (optional)
              </label>
              <Input
                placeholder="Deep Cleaning, Standard Cleaning..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">
                Property Address
              </label>
              <Input
                placeholder="123 Main St, Unit 2"
                value={form.property_address}
                onChange={(e) =>
                  setForm({ ...form, property_address: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">
                Service Type
              </label>
              <Select
                value={form.service_type}
                onValueChange={(v) => setForm({ ...form, service_type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose service type" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-md">
                  <SelectItem value="standard">Standard Cleaning</SelectItem>
                  <SelectItem value="deep">Deep Cleaning</SelectItem>
                  <SelectItem value="move-out">Move-out Cleaning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">
                Preferred Date
              </label>
              <Input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={form.scheduled_date || ""}
                onChange={(e) =>
                  setForm({ ...form, scheduled_date: e.target.value })
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium block mb-1">
                Additional Notes
              </label>
              <Textarea
                placeholder="Anything you'd like us to know?"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button
                disabled={!form.service_type || !form.scheduled_date}
                onClick={createCustomerJob}
                className="px-8"
              >
                {customerLoading ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ⭐ JOBS LIST */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">My Requests</h2>

          {!isMobile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
              className="flex items-center gap-2"
            >
              {viewMode === "list" ? (
                <LayoutGrid className="w-4 h-4" />
              ) : (
                <List className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        {viewMode === "list" && !isMobile ? (
          /* ⭐ LIST VIEW */
          <div className="overflow-x-auto bg-white shadow rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Job</th>
                  <th className="px-4 py-2 text-left">Address</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredJobs.map((job) =>
                  job.deleted ? null : (
                    <tr
                      key={job.id}
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => (window.location.href = `/jobs/${job.id}`)}
                    >
                      <td className="px-4 py-2 font-medium">
                        {getFriendlyName(job.service_type)}
                      </td>
                      <td className="px-4 py-2">{job.property_address}</td>
                      <td className="px-4 py-2">
                        {new Date(job.scheduled_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            job.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : job.status === "in_progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {job.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* ⭐ GRID VIEW — SAME STYLE AS ADMIN */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredJobs
              .filter((j) => !j.deleted)
              .map((job) => (
                <Card
                  key={job.id}
                  className="border shadow-sm rounded-xl hover:shadow-lg transition cursor-pointer"
                  onClick={() => (window.location.href = `/jobs/${job.id}`)}
                >
                  {/* ⭐ PHOTO */}
                  <div className="rounded-t-xl overflow-hidden bg-gray-200 aspect-video">
                    <Slider jobId={job.id} mini />
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 truncate">
                      <ClipboardList className="w-5 h-5 text-primary" />
                      {getFriendlyName(job.service_type)}
                    </CardTitle>

                    <CardDescription className="text-sm text-muted-foreground">
                      <CalendarDays className="w-4 h-4 inline mr-1" />
                      {job.scheduled_date}

                      {/* ⭐ FIX HYDRATION — CAMBIAR div → span */}
                      <span className="block text-xs text-gray-600 mt-1">
                        📍 {job.property_address || "No address provided"}
                      </span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
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
              ))}
          </div>
        )}
      </div>
    </main>
  );
}
