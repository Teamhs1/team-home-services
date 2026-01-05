"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminJobsView from "./AdminJobsView";

export default function AdminJobsContainer({ staffList, clientList }) {
  const [jobs, setJobs] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [loading, setLoading] = useState(true);

  async function fetchJobs() {
    try {
      const res = await fetch("/api/admin/jobs", {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to load jobs");

      const json = await res.json();

      // 👇 MUY IMPORTANTE
      const data = Array.isArray(json.data) ? json.data : json;

      setJobs(data);
      return data; // 👈 para tu polling
    } catch (err) {
      console.error(err);
      toast.error("Error loading jobs");
      return [];
    } finally {
      setLoading(false);
    }
  }

  async function deleteJob(jobId) {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Job deleted");
      fetchJobs();
    } catch {
      toast.error("Error deleting job");
    }
  }

  useEffect(() => {
    fetchJobs();
  }, []);

  if (loading) {
    return <div className="p-10 text-center">Loading jobs…</div>;
  }

  return (
    <AdminJobsView
      jobs={jobs}
      staffList={staffList}
      clientList={clientList}
      viewMode={viewMode}
      setViewMode={setViewMode}
      fetchJobs={fetchJobs}
      deleteJob={deleteJob}
    />
  );
}
