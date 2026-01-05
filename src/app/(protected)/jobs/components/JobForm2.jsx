"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

/* =======================
   SERVICE TYPES
======================= */
const SERVICE_TYPES = [
  { value: "light", label: "Light Cleaning", description: "Quick maintenance" },
  {
    value: "standard",
    label: "Standard Cleaning",
    description: "Regular clean",
  },
  { value: "deep", label: "Deep Cleaning", description: "Detailed deep clean" },
  {
    value: "heavy",
    label: "Heavy Cleaning",
    description: "Intensive cleaning",
  },
  {
    value: "move-out",
    label: "Move-out / Move-in",
    description: "Vacant unit",
  },
  {
    value: "post-construction",
    label: "Post-Construction",
    description: "After construction",
  },
  { value: "restoration", label: "Restoration", description: "After damage" },
  { value: "renovation", label: "Renovation", description: "After renovation" },
  { value: "add-ons", label: "Add-ons Only", description: "Extras only" },
];

export default function JobForm({
  staffList = [],
  clientList = [],
  companyList = [], // ✅ NUEVO (IGUAL QUE KEYS)
  fetchJobs,
}) {
  /* =======================
     STATE
  ====================== */
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [companyId, setCompanyId] = useState(""); // ✅ NUEVO
  const [clientId, setClientId] = useState("");
  const [serviceType, setServiceType] = useState("standard");
  const [scheduledDate, setScheduledDate] = useState("");

  const [creating, setCreating] = useState(false);
  const toastShownRef = useRef(false);

  // ❗ NO CAMBIAMOS VALIDACIÓN EXISTENTE
  const isValid = title.trim() && scheduledDate && clientId.trim();

  /* =======================
     SUBMIT
  ====================== */
  async function createJob() {
    if (!isValid || creating) return;

    setCreating(true);
    toastShownRef.current = false;

    try {
      const res = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          assigned_to: assignedTo || null,
          assigned_client: clientId,
          company_id: companyId || null, // ✅ CLAVE
          service_type: serviceType,
          scheduled_date: format(new Date(scheduledDate), "yyyy-MM-dd"),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error creating job");

      if (typeof fetchJobs === "function") await fetchJobs();

      toast.custom(() => (
        <div className="flex items-center gap-2 px-4 py-3 rounded-md border bg-green-50 text-green-700 shadow-sm text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          <span>Job created successfully</span>
        </div>
      ));

      // RESET
      setTitle("");
      setAssignedTo("");
      setCompanyId("");
      setClientId("");
      setServiceType("standard");
      setScheduledDate("");
    } catch (err) {
      toast.error(err.message || "Error creating job");
    } finally {
      setCreating(false);
    }
  }

  const dropdownClass =
    "bg-white border border-gray-200 shadow-md dark:bg-zinc-900 dark:border-zinc-700";

  /* =======================
     UI
  ====================== */
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-6">
      {/* Job Title */}
      <div className="space-y-1.5">
        <Label>Job Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-11"
        />
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <Label>Scheduled Date</Label>
        <Input
          type="date"
          value={scheduledDate}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => setScheduledDate(e.target.value)}
          className="h-11"
        />
      </div>

      {/* Company ✅ */}
      <div className="space-y-1.5">
        <Label>Company</Label>
        <Select value={companyId} onValueChange={setCompanyId}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select company" />
          </SelectTrigger>
          <SelectContent className={dropdownClass}>
            {companyList.map((company) => (
              <SelectItem key={company.id} value={String(company.id)}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Staff */}
      <div className="space-y-1.5">
        <Label>Staff</Label>
        <Select value={assignedTo} onValueChange={setAssignedTo}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select staff" />
          </SelectTrigger>
          <SelectContent className={`${dropdownClass} z-50`}>
            {staffList.map((staff) => (
              <SelectItem key={staff.clerk_id} value={staff.clerk_id}>
                {staff.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Client */}
      <div className="space-y-1.5">
        <Label>Client</Label>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select client" />
          </SelectTrigger>
          <SelectContent className={dropdownClass}>
            {clientList.map((client) => (
              <SelectItem key={client.clerk_id} value={client.clerk_id}>
                {client.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Service Type */}
      <div className="space-y-1.5">
        <Label>Service Type</Label>
        <Select value={serviceType} onValueChange={setServiceType}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select service type" />
          </SelectTrigger>
          <SelectContent className={dropdownClass}>
            {SERVICE_TYPES.map((service) => (
              <SelectItem key={service.value} value={service.value}>
                <div className="flex flex-col">
                  <span className="font-medium">{service.label}</span>
                  <span className="text-xs text-gray-600">
                    {service.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Submit */}
      <div className="flex items-end">
        <Button
          onClick={createJob}
          disabled={!isValid || creating}
          className="w-full h-11 font-semibold"
        >
          {creating ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating…
            </span>
          ) : (
            "Create Job"
          )}
        </Button>
      </div>
    </div>
  );
}
