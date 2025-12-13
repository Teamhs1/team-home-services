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
import { Loader2, CheckCircle2, Calendar as CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function JobForm({ staffList = [], clientList = [] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ========= STATE =========
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [clientId, setClientId] = useState("");
  const [serviceType, setServiceType] = useState("standard");

  // ✅ FECHA COMO Date (NO string)
  const [scheduledDate, setScheduledDate] = useState("");

  const [creating, setCreating] = useState(false);
  const toastShownRef = useRef(false);

  // ========= VALIDACIONES =========
  const isValid =
    title.trim() && scheduledDate && assignedTo.trim() && clientId.trim();

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

          // ✅ convertir SOLO al enviar
          scheduled_date: format(scheduledDate, "yyyy-MM-dd"),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error creating job");

      if (!toastShownRef.current) {
        toast.custom(() => (
          <div className="flex items-center gap-2 px-4 py-3 rounded-md border bg-green-50 text-green-700 shadow-sm text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Job created successfully</span>
          </div>
        ));
        toastShownRef.current = true;
      }

      // CLEANUP UX
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
          <SelectContent className={dropdownClass}>
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
          <SelectTrigger className="h-11 capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={dropdownClass}>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="deep">Deep</SelectItem>
            <SelectItem value="move-out">Move-out</SelectItem>
            <SelectItem value="add-ons">Add-ons</SelectItem>
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
