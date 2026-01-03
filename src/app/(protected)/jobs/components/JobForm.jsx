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
   SERVICE TYPES (UX PRO)
======================= */
const SERVICE_TYPES = [
  {
    value: "light",
    label: "Light Cleaning",
    description: "Quick maintenance or touch-up cleaning",
  },
  {
    value: "standard",
    label: "Standard Cleaning",
    description: "Regular residential cleaning",
  },
  {
    value: "deep",
    label: "Deep Cleaning",
    description: "Detailed deep clean (kitchen, baths, baseboards)",
  },
  {
    value: "heavy",
    label: "Heavy / Intensive Cleaning",
    description: "Full scrubbing of walls, cabinets, windows & extreme dirt",
  },
  {
    value: "move-out",
    label: "Move-out / Move-in",
    description: "Full clean for vacant units",
  },
  {
    value: "post-construction",
    label: "Post-Construction",
    description: "Dust & debris after construction work",
  },
  {
    value: "restoration",
    label: "Restoration Cleaning",
    description: "After water, fire or damage restoration",
  },
  {
    value: "renovation",
    label: "Renovation Cleaning",
    description: "After renovation or remodeling",
  },
  {
    value: "add-ons",
    label: "Add-ons Only",
    description: "Oven, fridge, windows, extras",
  },
];

export default function JobForm({
  staffList = [],
  clientList = [],
  fetchJobs, // ✅ RECIBIDO
}) {
  // ========= STATE =========
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [clientId, setClientId] = useState("");
  const [serviceType, setServiceType] = useState("standard");
  const [scheduledDate, setScheduledDate] = useState("");

  const [creating, setCreating] = useState(false);
  const toastShownRef = useRef(false);

  // ========= VALIDATION =========
  const isValid = title.trim() && scheduledDate && clientId.trim();

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
          assigned_to: assignedTo,
          assigned_client: clientId,
          service_type: serviceType,
          scheduled_date: format(new Date(scheduledDate), "yyyy-MM-dd"),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error creating job");

      // 🔄 REFRESH JOBS LIST (CLAVE)
      if (typeof fetchJobs === "function") {
        await fetchJobs();
      }

      if (!toastShownRef.current) {
        toast.custom(() => (
          <div className="flex items-center gap-2 px-4 py-3 rounded-md border bg-green-50 text-green-700 shadow-sm text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Job created successfully</span>
          </div>
        ));
        toastShownRef.current = true;
      }

      // RESET FORM
      setTitle("");
      setAssignedTo("");
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
      {/* Job Title */}
      <div className="space-y-1.5">
        <Label>Job Title</Label>
        <Input
          placeholder="Example: 45 Cameron #C"
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

      {/* Staff */}
      <div className="space-y-1.5">
        <Label>Staff</Label>
        <Select value={assignedTo} onValueChange={setAssignedTo}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select staff" />
          </SelectTrigger>
          <SelectContent position="popper" className={`${dropdownClass} z-50`}>
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
                <div className="flex flex-col gap-0.5">
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
              <Loader2 className="h-4 w-4 animate-spin" />
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
