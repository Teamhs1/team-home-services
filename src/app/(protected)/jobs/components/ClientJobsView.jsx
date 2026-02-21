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
import { useSearchParams } from "next/navigation";

// ⭐ IMPORTANTE → Slider igual que Admin
import Slider from "@/components/Slider";

export default function ClientJobsView({
  customerJobs,
  customerLoading,
  form,
  setForm,
  createCustomerJob,
  viewMode,
  setViewMode,
}) {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "all";
  const [serviceTypes, setServiceTypes] = React.useState([]);
  const [serviceLoading, setServiceLoading] = React.useState(true);
  const [estimatedDuration, setEstimatedDuration] = React.useState(null);
  const [estimateLoading, setEstimateLoading] = React.useState(false);
  const isHallwayService = form.service_type?.includes("hallway");
  useEffect(() => {
    if (!form.service_type) {
      setEstimatedDuration(null);
      return;
    }

    setEstimateLoading(true);

    fetch("/api/duration-estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_type: form.service_type,

        bedrooms: isHallwayService ? null : Number(form.bedrooms),
        bathrooms: isHallwayService ? null : Number(form.bathrooms),

        floors: isHallwayService ? Number(form.floors) : null,

        unit_type: form.unit_type,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setEstimatedDuration(data.hours ?? null);
      })
      .catch(() => {
        setEstimatedDuration(null);
      })
      .finally(() => {
        setEstimateLoading(false);
      });
  }, [
    form.service_type,
    form.bedrooms,
    form.bathrooms,
    form.floors,
    form.unit_type,
  ]);

  // ⭐ Forzar GRID en móviles
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setViewMode("grid");
    }
  }, [setViewMode]);
  useEffect(() => {
    async function loadServiceTypes() {
      try {
        const res = await fetch("/api/service-types");

        if (!res.ok) {
          console.error("Service types fetch failed:", res.status);
          return;
        }

        const text = await res.text();
        if (!text) return;

        const data = JSON.parse(text);

        const active =
          data
            ?.filter((t) => t.is_active !== false)
            ?.sort((a, b) => a.name.localeCompare(b.name)) || [];

        setServiceTypes(active);
      } catch (err) {
        console.error("Error loading service types", err);
      } finally {
        setServiceLoading(false);
      }
    }

    loadServiceTypes();
  }, []);
  // ⭐ Friendly Display Name
  const getFriendlyName = (value) => {
    const found = serviceTypes.find((t) => t.value === value);
    return found?.name || value?.replaceAll("_", " ");
  };

  // ⭐ Remove duplicates
  const uniqueJobs = Array.from(
    new Map(customerJobs.map((j) => [j.id, j])).values(),
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
                value={form.property_address || ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    property_address: e.target.value,
                  }))
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
                  {serviceLoading && (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  )}

                  {serviceTypes.map((type) => (
                    <SelectItem key={type.id} value={type.value}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Property Details */}
              {!isHallwayService ? (
                /* 🏠 NORMAL APARTMENT/HOUSE */
                <div className="grid md:grid-cols-3 grid-cols-1 gap-4 mt-4">
                  <Select
                    value={String(form.bedrooms || 2)}
                    onValueChange={(v) =>
                      setForm({ ...form, bedrooms: Number(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bedrooms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Bedroom</SelectItem>
                      <SelectItem value="2">2 Bedrooms</SelectItem>
                      <SelectItem value="3">3 Bedrooms</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={String(form.bathrooms || 1)}
                    onValueChange={(v) =>
                      setForm({ ...form, bathrooms: Number(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bathrooms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Bathroom</SelectItem>
                      <SelectItem value="2">2 Bathrooms</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={form.unit_type || "apartment"}
                    onValueChange={(v) => setForm({ ...form, unit_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unit Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                /* 🏢 HALLWAY MODE */
                <div className="grid md:grid-cols-1 grid-cols-1 gap-4 mt-4">
                  <Select
                    value={String(form.floors || 1)}
                    onValueChange={(v) =>
                      setForm({ ...form, floors: Number(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Number of Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Level</SelectItem>
                      <SelectItem value="2">2 Levels</SelectItem>
                      <SelectItem value="3">3 Levels</SelectItem>
                      <SelectItem value="4">4+ Levels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {form.service_type && (
                <div className="mt-3 transition-all duration-300">
                  {estimateLoading ? (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Calculating estimated duration...
                    </div>
                  ) : estimatedDuration !== null ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2 text-blue-800 font-medium">
                        ⏱ Estimated duration
                      </div>
                      <div className="text-sm text-blue-700 mt-1">
                        {estimatedDuration} hours
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-500">
                      ⏱ No estimate available for this configuration
                    </div>
                  )}
                </div>
              )}
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
                  <th className="px-4 py-2 text-left">Request</th>
                  <th className="px-4 py-2 text-left">Service</th>
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
                      <td className="px-4 py-2">
                        <div className="font-semibold">
                          {job.title?.trim() || "Cleaning Request"}
                        </div>
                      </td>

                      <td className="px-4 py-2">
                        {getFriendlyName(job.service_type)}
                      </td>

                      <td className="px-4 py-2">
                        {job.property_address || "—"}
                      </td>

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
                  ),
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
                      {job.title?.trim() || getFriendlyName(job.service_type)}
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
