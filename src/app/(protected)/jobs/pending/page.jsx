"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";
import {
  Loader2,
  CalendarDays,
  ClipboardList,
  List,
  LayoutGrid,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation"; // ⭐ IMPORTANTE

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function PendingJobsPage() {
  const { getToken } = useAuth();
  const router = useRouter(); // ⭐ NUEVO
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");

  async function fetchPendingJobs() {
    setLoading(true);
    try {
      const token = await getToken({ template: "supabase" });

      const supabase = createClient(
        supabaseUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: { headers: { Authorization: `Bearer ${token}` } },
        }
      );

      const { data, error } = await supabase
        .from("cleaning_jobs")
        .select("*")
        .eq("status", "pending")
        .order("scheduled_date", { ascending: true });

      if (!error) setJobs(data || []);
      else console.error("❌ Error fetching pending jobs:", error.message);
    } catch (err) {
      console.error("⚠️ Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPendingJobs();
  }, []);

  useEffect(() => {
    const savedMode = localStorage.getItem("pendingViewMode");
    if (savedMode) setViewMode(savedMode);
  }, []);

  useEffect(() => {
    localStorage.setItem("pendingViewMode", viewMode);
  }, [viewMode]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin w-6 h-6 text-primary" />
      </div>
    );

  return (
    <div className="pt-28 px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-yellow-600" />
          Pending Jobs
        </h1>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          className="flex items-center gap-2"
        >
          {viewMode === "grid" ? (
            <List className="w-4 h-4" />
          ) : (
            <LayoutGrid className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Content */}
      {jobs.length === 0 ? (
        <p className="text-gray-500">No pending jobs found.</p>
      ) : viewMode === "grid" ? (
        // 🧱 GRID VIEW — CLICKEABLE
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Card
              key={job.id}
              onClick={() => router.push(`/jobs/${job.id}`)} // ⭐ CLICK!
              className="cursor-pointer border border-gray-200 shadow-sm hover:shadow-md transition"
            >
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  {job.title || "Untitled Job"}
                </CardTitle>
              </CardHeader>

              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>{job.property_address || "No address provided"}</p>

                <p className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  {job.scheduled_date
                    ? new Date(job.scheduled_date).toLocaleDateString()
                    : "No date set"}
                </p>

                <p className="capitalize font-medium text-yellow-600">
                  {job.status || "unknown"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // 📋 LIST VIEW — CLICKEABLE
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-left text-sm font-medium">
              <tr>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Property</th>
                <th className="px-4 py-2">Scheduled Date</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>

            <tbody>
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  onClick={(e) => {
                    const tag = e.target.tagName.toLowerCase();
                    if (["button", "svg", "path"].includes(tag)) return;

                    router.push(`/jobs/${job.id}`); // ⭐ CLICK!
                  }}
                  className="cursor-pointer border-t hover:bg-gray-50 transition text-sm"
                >
                  <td className="px-4 py-2">{job.title || "Untitled"}</td>

                  <td className="px-4 py-2">
                    {job.property_address || "No address"}
                  </td>

                  <td className="px-4 py-2">
                    {job.scheduled_date
                      ? new Date(job.scheduled_date).toLocaleDateString()
                      : "No date"}
                  </td>

                  <td className="px-4 py-2 capitalize text-yellow-600 font-medium">
                    {job.status || "unknown"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
