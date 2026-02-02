"use client";
import ViewToggleButton from "@/components/ViewToggleButton";

import AdminEditDuration from "@/components/jobs/AdminEditDuration";
import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { toast } from "sonner";
import { useSupabaseWithClerk } from "@/utils/supabase/useSupabaseWithClerk";
import {
  CalendarDays,
  User,
  LayoutGrid,
  List,
  MoreVertical,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import JobForm from "./JobForm";
import Slider from "@/components/Slider";
import JobDuration from "./JobDuration";
import JobTimer from "./JobTimer";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
const isUUID = (v) =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );

export default function AdminJobsView({
  jobs,
  clientList,
  viewMode,
  setViewMode,
  fetchJobs,
  deleteJob,
  activeStatus,
}) {
  const deleteJobsBulk = async (ids) => {
    try {
      const res = await fetch("/api/jobs/delete-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`🗑️ ${data.count} jobs deleted`);
      clearSelection();
      fetchJobs();
    } catch (err) {
      console.error(err);
      toast.error("Error deleting jobs");
    }
  };

  const assignClientBulk = async (clientId) => {
    if (!clientId || selectedJobs.size === 0) return;

    try {
      const res = await fetch("/api/jobs/assign-client-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobIds: Array.from(selectedJobs),
          clientProfileId: clientId,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(`✅ Client assigned to ${json.count} jobs`);
      clearSelection();
      setBulkClientId("");
      await fetchJobs();
    } catch (err) {
      toast.error(err.message);
    }
  };
  const assignStaffBulk = async (staffClerkId) => {
    if (!staffClerkId || selectedJobs.size === 0) return;

    try {
      const res = await fetch("/api/jobs/assign-staff-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobIds: Array.from(selectedJobs),
          staffClerkId,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(`✅ Staff assigned to ${json.count} jobs`);
      clearSelection();
      setBulkStaffId("");
      await fetchJobs();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const [companyList, setCompanyList] = useState([]);
  const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

  const { getClientWithToken } = useSupabaseWithClerk();
  const [localJobs, setLocalJobs] = useState(jobs);
  const [lastCheckedAt, setLastCheckedAt] = useState(new Date().toISOString());
  const [isMobile, setIsMobile] = useState(false);
  const [bulkClientId, setBulkClientId] = useState("");
  const [bulkStaffId, setBulkStaffId] = useState("");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  function AdminListCards({
    jobs,
    staffList,
    loadedClients,
    assignToStaff,
    assignToClient,
    isUUID,
  }) {
    return (
      <div className="space-y-3">
        {jobs.map((job) => (
          <Card
            key={job.id}
            className="border shadow-sm rounded-xl overflow-hidden"
            onClick={() => (window.location.href = `/jobs/${job.id}`)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base truncate">{job.title}</CardTitle>

              <CardDescription className="text-xs text-gray-500 flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                {job.scheduled_date || "No date"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>Type:</strong> {job.service_type}
              </p>

              {/* STAFF */}
              <select
                className="border rounded-md p-1 w-full"
                value={job.assigned_to || ""}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => assignToStaff(job.id, e.target.value || null)}
              >
                <option value="">Unassigned</option>
                {staffList.map((s) => (
                  <option key={s.clerk_id} value={s.clerk_id}>
                    {s.full_name || s.email}
                  </option>
                ))}
              </select>

              {/* CLIENT */}
              <select
                value={job.client_profile_id || ""}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => assignToClient(job.id, e.target.value || null)}
              >
                <option value="">No client</option>

                {loadedClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name || c.email}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  // 🔁 Sync props → local state (CLAVE)
  useEffect(() => {
    console.log("🧪 AdminJobsView jobs:", jobs);
    setLocalJobs(safeArray(jobs));
  }, [jobs]);

  // Seleccion Multiple
  const [selectedJobs, setSelectedJobs] = useState(new Set());
  const [editingJob, setEditingJob] = useState(null);

  // Cambia el estado de selección de un job
  const toggleJobSelection = (jobId) => {
    setSelectedJobs((prev) => {
      const next = new Set(prev);
      next.has(jobId) ? next.delete(jobId) : next.add(jobId);
      return next;
    });
  };

  // Verifica si un job está seleccionado
  const isSelected = (jobId) => selectedJobs.has(jobId);

  // Desmarcar todas las selecciones
  const clearSelection = () => setSelectedJobs(new Set());

  // LOAD CLIENTS (SOLO role = client)
  const [loadedClients, setLoadedClients] = useState([]);

  useEffect(() => {
    async function fetchClients() {
      try {
        const supabase = await getClientWithToken();

        if (!supabase) {
          throw new Error("Supabase client not available (JWT missing)");
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("id, clerk_id, full_name, email, role")
          .or("role.eq.client,role.eq.customer,role.is.null");

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        const safeClients = (data || []).filter(
          (c) => typeof c.id === "string" && !c.id.startsWith("user_"),
        );

        setLoadedClients(safeClients);
      } catch (err) {
        console.error("❌ Error fetching clients:", err?.message || err);
        toast.error("Could not load clients");
        setLoadedClients([]);
      }
    }

    fetchClients();
  }, [getClientWithToken]);

  // ⭐ DATE FILTER (ALL / WEEK / MONTH)
  const [dateFilter, setDateFilter] = useState("all");

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const dateFilteredJobs = localJobs.filter((job) => {
    // ✅ Si no tiene fecha, NO lo descartes
    if (!job.scheduled_date) return true;

    const jobDate = new Date(job.scheduled_date);

    if (dateFilter === "week") return jobDate >= startOfWeek;
    if (dateFilter === "month") return jobDate >= startOfMonth;

    return true;
  });

  console.log("localJobs:", localJobs.length);
  console.log("dateFilteredJobs:", dateFilteredJobs.length);

  // 🔍 SEARCH FILTER
  const [searchTerm, setSearchTerm] = useState("");

  // ⭐ NEW: CLIENT FILTER
  const [clientFilter, setClientFilter] = useState("all");
  // ⭐ NEW: STAFF FILTER
  const [staffFilter, setStaffFilter] = useState("all");
  // 📄 PAGINATION
  const PAGE_SIZE = viewMode === "grid" ? 12 : 30;
  const [currentPage, setCurrentPage] = useState(1);

  // ⭐ APPLY CLIENT + STAFF FILTERS (UUID SAFE)
  const finalFilteredJobs = dateFilteredJobs
    .filter((job) => {
      if (clientFilter === "all") return true;
      if (!isUUID(clientFilter)) return true;
      return job.client_profile_id === clientFilter;
    })

    .filter((job) => {
      if (staffFilter === "all") return true;
      if (staffFilter === "unassigned") return !job.assigned_to;
      return job.assigned_to === staffFilter;
    });

  // 🔍 APPLY SEARCH FILTER (AQUÍ VA)
  const searchedJobs = finalFilteredJobs.filter((job) => {
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();

    return (
      job.title?.toLowerCase().includes(term) ||
      job.property_address?.toLowerCase().includes(term)
    );
  });

  // 📄 PAGINATED JOBS
  const totalJobs = searchedJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalJobs / PAGE_SIZE));

  const paginatedJobs = searchedJobs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch("/api/admin/companies", {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) return;

        const data = await res.json();
        setCompanyList(data || []);
      } catch (err) {
        console.error("❌ Error loading companies:", err);
        toast.error("Could not load companies");
      }
    }

    loadCompanies();
  }, []);

  // 🔄 RESET PAGE WHEN FILTERS CHANGE
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, clientFilter, staffFilter, viewMode]);

  // ⏱️ FORMAT MINUTES → HOURS + MINUTES (SOLO VISUAL)
  const formatDuration = (minutes) => {
    if (minutes == null || isNaN(minutes)) return "—";

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    if (h > 0 && m > 0) return `${h} h ${m} min`;
    if (h > 0) return `${h} h`;
    return `${m} min`;
  };

  // ASSIGN STAFF (USA API)
  const assignToStaff = async (jobId, staffClerkId) => {
    try {
      const res = await fetch("/api/jobs/assign-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          staffClerkId: staffClerkId || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("✅ Staff assigned successfully");
      await fetchJobs(); // 🔥 CLAVE PARA FILTROS + UI
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ASSIGN CLIENT (USA API + SERVICE ROLE)
  const assignToClient = async (jobId, clientProfileId) => {
    const res = await fetch("/api/jobs/assign-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        clientProfileId, // 🔥 UUID
      }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error);

    toast.success("✅ Client updated");
    await fetchJobs();
  };

  /* =======================
     LOAD STAFF
  ======================= */
  const [staffList, setStaffList] = useState([]);

  useEffect(() => {
    async function loadStaff() {
      try {
        const res = await fetch("/api/admin/staff", {
          cache: "no-store",
          credentials: "include", // 🔥 CLAVE
        });

        if (!res.ok) throw new Error("Failed to load staff");

        const data = await res.json();

        const safeStaff = (data || []).filter(
          (s) => s.clerk_id && typeof s.clerk_id === "string",
        );

        setStaffList(safeStaff);
      } catch (err) {
        console.error("❌ Error loading staff:", err);
        setStaffList([]);
      }
    }

    loadStaff();
  }, []);

  /* =========================
   SMART POLLING (NO REALTIME)
========================= */
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/has-changes?since=${lastCheckedAt}`);
        const { hasChanges } = await res.json();

        if (hasChanges) {
          console.log("🔄 Jobs changed → refreshing");

          const fresh = await fetchJobs(); // 👈 fetchJobs DEBE retornar jobs
          if (Array.isArray(fresh)) {
            setLocalJobs(fresh); // 🔥 fuerza render inmediato
          }

          setLastCheckedAt(new Date().toISOString());
        }
      } catch (err) {
        console.warn("Polling skipped");
      }
    }, 15000); // ⏱️ cada 15s

    return () => clearInterval(interval);
  }, [fetchJobs, lastCheckedAt]);

  // RESET JOB
  const resetJob = async (jobId) => {
    try {
      const supabase = await getClientWithToken();
      const { data: photos } = await supabase
        .from("job_photos")
        .select("*")
        .eq("job_id", jobId);

      const filePaths = (photos || [])
        .map((p) => {
          const raw =
            p.file_path ||
            p.path ||
            p.photo_path ||
            p.storage_path ||
            p.url ||
            p.photo_url;

          if (!raw) return null;
          if (raw.startsWith("http")) {
            const clean = raw.split("/public/")[1];
            return clean || null;
          }
          return raw;
        })
        .filter(Boolean);

      if (filePaths.length > 0) {
        await supabase.storage.from("job-photos").remove(filePaths);
      }

      await supabase.from("job_photos").delete().eq("job_id", jobId);

      await supabase
        .from("cleaning_jobs")
        .update({
          status: "pending",
          start_time: null,
          end_time: null,
          completed_at: null,
          duration_minutes: null,
        })
        .eq("id", jobId);

      toast.success("⏳ Job reset successfully!");
      // Realtime se encarga de sincronizar
    } catch (err) {
      toast.error("Error resetting job");
    }
  };

  return (
    <main className="px-2 sm:px-6 py-4 sm:py-10 max-w-[1600px] mx-auto space-y-6 sm:space-y-10 overflow-x-hidden">
      {/* EMPTY STATE */}
      {paginatedJobs.length === 0 && (
        <div className="text-center text-gray-500 py-20">
          No jobs match current filters.
        </div>
      )}

      {/* HEADER */}
      <div>
        {/* TÍTULO + TOGGLE (MOBILE) */}
        <div className="flex items-center justify-between sm:hidden">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🧽 All Jobs
          </h1>

          {/* TOGGLE SOLO MOBILE */}
          <ViewToggleButton viewMode={viewMode} setViewMode={setViewMode} />
        </div>

        {/* DESKTOP HEADER */}
        <div className="hidden sm:flex sm:items-center sm:justify-between">
          {/* TÍTULO */}
          <h1 className="text-3xl font-bold flex items-center gap-2">
            🧽 All Jobs
          </h1>

          {/* FILTROS + TOGGLE */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search by property or job..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm w-56
          focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              className="border rounded-md p-2 text-sm"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">All Jobs</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            <select
              className="border rounded-md p-2 text-sm"
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
            >
              <option value="all">All Staff</option>
              <option value="unassigned">Unassigned</option>
              {staffList.map((s) => (
                <option key={s.clerk_id} value={s.clerk_id}>
                  {s.full_name || s.email}
                </option>
              ))}
            </select>

            <select
              className="border rounded-md p-2 text-sm"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
            >
              <option value="all">All Clients</option>
              {loadedClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name || c.email}
                </option>
              ))}
            </select>

            {/* TOGGLE SOLO DESKTOP */}
            <ViewToggleButton viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>

        {/* FILTROS MOBILE */}
        <div className="mt-4 flex flex-col gap-3 sm:hidden">
          <input
            type="text"
            placeholder="Search by property or job..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm w-full
        focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            className="border rounded-md p-2 text-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Jobs</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <select
            className="border rounded-md p-2 text-sm"
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
          >
            <option value="all">All Staff</option>
            <option value="unassigned">Unassigned</option>
            {staffList.map((s) => (
              <option key={s.clerk_id} value={s.clerk_id}>
                {s.full_name || s.email}
              </option>
            ))}
          </select>

          <select
            className="border rounded-md p-2 text-sm"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
          >
            <option value="all">All Clients</option>
            {loadedClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name || c.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MULTI-SELECTION ACTION BAR */}
      {selectedJobs.size > 0 && (
        <div className="sticky top-2 z-20 bg-white border shadow-sm rounded-lg px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedJobs.size} job(s) selected
          </span>
          <div className="flex items-center gap-2">
            {/* BULK STAFF */}
            <select
              className="border rounded-md p-2 text-sm"
              value={bulkStaffId}
              onChange={(e) => {
                const v = e.target.value;
                setBulkStaffId(v);
                assignStaffBulk(v); // ⚡ automático
              }}
            >
              <option value="">Assign staff…</option>
              <option value="unassigned">Unassigned</option>
              {staffList.map((s) => (
                <option key={s.clerk_id} value={s.clerk_id}>
                  {s.full_name || s.email}
                </option>
              ))}
            </select>

            {/* BULK CLIENT */}
            <select
              className="border rounded-md p-2 text-sm"
              value={bulkClientId}
              onChange={(e) => {
                const v = e.target.value;
                setBulkClientId(v);
                assignClientBulk(v); // ⚡ automático también
              }}
            >
              <option value="">Assign client…</option>
              {loadedClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name || c.email}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-200"
              onClick={(e) => {
                e.stopPropagation(); // 🔥 CLAVE ABSOLUTA

                if (
                  confirm(
                    `Delete ${selectedJobs.size} selected job(s)? This action cannot be undone.`,
                  )
                ) {
                  deleteJobsBulk(Array.from(selectedJobs));
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>

            <Button size="sm" variant="ghost" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* CREATE JOB (HIDDEN ON MOBILE) */}
      {!isMobile && (
        <Card className="border shadow-md rounded-xl p-2 sm:p-4">
          <CardHeader>
            <CardTitle>Create New Job</CardTitle>
            <CardDescription>Add a new cleaning job.</CardDescription>
          </CardHeader>
          <CardContent>
            <JobForm
              staffList={staffList}
              clientList={loadedClients}
              companyList={companyList}
              fetchJobs={fetchJobs}
            />
          </CardContent>
        </Card>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" ? (
        isMobile ? (
          /* 📱 MOBILE → CARDS (como Staff) */
          <AdminListCards
            jobs={paginatedJobs}
            staffList={staffList}
            loadedClients={loadedClients}
            assignToStaff={assignToStaff}
            assignToClient={assignToClient}
            isUUID={isUUID}
          />
        ) : (
          <div className="block bg-white shadow rounded-lg border overflow-x-auto">
            <table className="w-full text-sm min-w-[720px] table-fixed">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  {/* SELECT ALL */}
                  <th className="px-4 py-2 w-10">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedJobs(
                            new Set(finalFilteredJobs.map((j) => j.id)),
                          );
                        } else {
                          clearSelection();
                        }
                      }}
                      checked={
                        finalFilteredJobs.length > 0 &&
                        finalFilteredJobs.every((j) => selectedJobs.has(j.id))
                      }
                    />
                  </th>

                  <th className="px-4 py-2 w-[180px] text-left">Job</th>
                  <th className="px-4 py-2 w-[320px] text-left">Address</th>
                  <th className="px-4 py-2 w-[110px] text-left">Date</th>
                  <th className="px-4 py-2 w-[90px] text-left">Type</th>

                  <th className="px-4 py-2 text-left">Staff</th>
                  <th className="px-4 py-2 text-left">Client</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Duration</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginatedJobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={(e) => {
                      // 🔥 SI HAY SELECCIÓN, NO HAGAS NADA
                      if (selectedJobs.size > 0) return;

                      const tag = e.target.tagName.toLowerCase();
                      if (
                        [
                          "button",
                          "select",
                          "option",
                          "svg",
                          "path",
                          "input",
                        ].includes(tag)
                      )
                        return;

                      window.location.href = `/jobs/${job.id}`;
                    }}
                  >
                    <td
                      className="px-4 py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected(job.id)}
                        onChange={() => toggleJobSelection(job.id)}
                      />
                    </td>

                    <td className="px-4 py-2">{job.title}</td>
                    <td className="px-4 py-2 truncate whitespace-nowrap text-gray-600">
                      {job.property_address || "—"}
                    </td>

                    <td className="px-4 py-2">{job.scheduled_date}</td>
                    <td className="px-4 py-2">{job.service_type}</td>

                    {/* STAFF */}
                    <td className="px-4 py-2">
                      <select
                        className="border rounded-md p-1 text-sm"
                        value={job.assigned_to || ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          assignToStaff(job.id, e.target.value || null)
                        }
                      >
                        <option value="">Unassigned</option>
                        {staffList.map((staff) => (
                          <option key={staff.id} value={staff.clerk_id}>
                            {staff.full_name || staff.email}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* CLIENT */}
                    <td className="px-4 py-2">
                      <select
                        className="border rounded-md p-1 text-sm bg-white"
                        value={job.client_profile_id || ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          assignToClient(job.id, e.target.value || null)
                        }
                      >
                        <option value="">No client</option>

                        {loadedClients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.full_name || c.email}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-sm font-semibold ${
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

                    <td className="px-4 py-2">
                      {job.status === "in_progress" && (
                        <JobTimer jobId={job.id} />
                      )}

                      {job.status === "completed" &&
                        (job.duration_minutes != null ? (
                          <span className="flex items-center gap-1 text-green-700 font-semibold">
                            ⏱️ {formatDuration(job.duration_minutes)} total
                          </span>
                        ) : (
                          <JobDuration jobId={job.id} />
                        ))}

                      {job.status === "pending" && "—"}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4 py-2 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          {/* ⏱️ EDIT DURATION */}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingJob(job);
                            }}
                          >
                            ⏱️ Edit duration
                          </DropdownMenuItem>

                          {/* 🔄 RESET */}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              resetJob(job.id);
                            }}
                          >
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Reset Job
                          </DropdownMenuItem>

                          {/* 🗑️ DELETE */}
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();

                              if (selectedJobs.size > 1) {
                                toast.info(
                                  "Use bulk actions to delete multiple jobs",
                                );
                                return;
                              }

                              if (
                                selectedJobs.size === 1 &&
                                !selectedJobs.has(job.id)
                              ) {
                                toast.info("This job is not the selected one");
                                return;
                              }

                              deleteJob(job.id);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* GRID VIEW */
        <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedJobs.map((job) => (
            <Card
              key={job.id}
              className="relative border shadow-sm rounded-2xl"
            >
              <div
                className="relative aspect-video bg-gray-100 cursor-pointer"
                onClick={() => (window.location.href = `/jobs/${job.id}`)}
              >
                <Slider jobId={job.id} mini />
              </div>

              <CardHeader className="pb-1">
                <CardTitle className="text-base sm:text-lg truncate">
                  {job.title}
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 flex items-center gap-1 TRUNCATE">
                  <CalendarDays className="w-3 h-3" />
                  {job.scheduled_date || "No date"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-1">
                <p className="text-sm">
                  <strong>Type:</strong> {job.service_type}
                </p>

                {/* STAFF */}
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <select
                    className="border rounded-md p-1 text-xs w-full min-w-0"
                    value={job.assigned_to || ""}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      assignToStaff(job.id, e.target.value || null)
                    }
                  >
                    <option value="">Unassigned</option>
                    {staffList.map((staff) => (
                      <option key={staff.id} value={staff.clerk_id}>
                        {staff.full_name || staff.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CLIENT */}
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <select
                    className="border rounded-md p-1 text-xs w-full min-w-0"
                    value={job.assigned_client_clerk_id || ""}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      assignToClient(job.id, e.target.value || null)
                    }
                  >
                    <option value="">No client</option>

                    {loadedClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name || c.email}
                      </option>
                    ))}
                  </select>
                </div>

                {job.client && (
                  <div className="text-[11px] text-gray-500 truncate pl-6">
                    {job.client.full_name || job.client.email}
                  </div>
                )}

                {/* STATUS */}
                <div>
                  {job.status === "in_progress" && (
                    <div className="bg-blue-50 text-blue-700 text-xs inline-block px-3 py-1 rounded-full shadow-sm">
                      <JobTimer jobId={job.id} />
                    </div>
                  )}

                  {job.status === "completed" && (
                    <div className="flex flex-col text-xs text-green-700">
                      {job.duration_minutes != null ? (
                        <div className="bg-green-50 px-3 py-1 inline-block font-semibold rounded-full shadow-sm">
                          ⏱️ {formatDuration(job.duration_minutes)}
                        </div>
                      ) : (
                        <JobDuration jobId={job.id} />
                      )}

                      <span className="text-gray-500 text-[11px]">
                        Done on{" "}
                        {job.completed_at
                          ? new Date(job.completed_at).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                  )}
                </div>

                {/* ACTIONS */}
                <div className="pt-1 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          resetJob(job.id);
                        }}
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Reset Job
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteJob(job.id);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {editingJob && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-80 space-y-4">
            <h3 className="font-semibold text-lg">Edit duration</h3>

            <AdminEditDuration
              job={editingJob}
              onUpdated={() => {
                fetchJobs();
                setEditingJob(null);
              }}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingJob(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* 📄 PAGINATION CONTROLS */}
      {totalJobs > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-6">
          <span className="text-sm text-gray-500">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, totalJobs)} of {totalJobs} jobs
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </Button>

            <span className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
