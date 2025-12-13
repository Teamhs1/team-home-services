"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
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
import { Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

export default function JobForm({
  staffList = [],
  clientList = [],
  fetchJobs,
}) {
  const { user } = useUser();

  // ========= STATE =========
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [clientId, setClientId] = useState("");
  const [serviceType, setServiceType] = useState("standard");
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [creating, setCreating] = useState(false);

  // ========= VALIDACIONES =========
  const isValid =
    title.trim() &&
    scheduledDate.trim() &&
    assignedTo.trim() &&
    clientId.trim();

  async function createJob() {
    if (!isValid) {
      toast.warning("Please fill in all required fields.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/jobs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ FIX CLAVE PARA CLERK
        body: JSON.stringify({
          title,
          assigned_to: assignedTo,
          assigned_client: clientId,
          service_type: serviceType,
          scheduled_date: scheduledDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error creating job.");

      toast.success("Job created successfully!");

      // 🔔 Realtime broadcast (solo UI, no seguridad)
      const anonClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      const channel = anonClient.channel("realtime_jobs_admin_global");
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.send({
            type: "broadcast",
            event: "job_created",
            payload: {
              title,
              service_type: serviceType,
              created_at: new Date().toISOString(),
            },
          });
          channel.unsubscribe();
        }
      });

      // CLEANUP
      setTitle("");
      setAssignedTo("");
      setClientId("");
      setServiceType("standard");
      setScheduledDate(new Date().toISOString().split("T")[0]);

      fetchJobs?.();
    } catch (err) {
      console.error("💥 Error:", err);
      toast.error(err.message || "Error creating job.");
    } finally {
      setCreating(false);
    }
  }

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
          <SelectContent>
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
          <SelectContent>
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
          <SelectContent>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="deep">Deep</SelectItem>
            <SelectItem value="move-out">Move-out</SelectItem>
            <SelectItem value="add-ons">Add-ons</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Button */}
      <div className="flex items-end">
        <Button
          onClick={createJob}
          disabled={creating || !isValid}
          className="w-full h-11 font-semibold"
        >
          {creating ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </div>
          ) : (
            "Create Job"
          )}
        </Button>
      </div>
    </div>
  );
}
