"use client";
import { useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs"; // 👈 añadimos useUser
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

export default function JobForm({ staffList = [], fetchJobs }) {
  const { getToken } = useAuth();
  const { user } = useUser(); // 👈 obtenemos el usuario logueado (admin o staff)
  const clerkId = user?.id || null;

  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [serviceType, setServiceType] = useState("standard");
  const [scheduledDate, setScheduledDate] = useState("");
  const [creating, setCreating] = useState(false);

  async function createJob() {
    if (!title.trim() || !scheduledDate.trim()) {
      toast.warning("Please fill in all required fields");
      return;
    }

    setCreating(true);
    try {
      // 🔑 Obtener token Clerk
      const token = await getToken();
      if (!token) throw new Error("No authentication token found");

      // 📡 Llamada a la API con created_by (Clerk ID)
      const res = await fetch("/api/jobs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          assigned_to: assignedTo || null,
          service_type: serviceType,
          scheduled_date: scheduledDate,
          created_by: clerkId, // ✅ importante: ahora se envía correctamente
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error creating job");

      toast.success(data.message || "✅ Job created successfully!");

      // 🔔 Broadcast opcional (notifica a admins conectados)
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
              created_by: data?.data?.[0]?.created_by,
              role: data?.data?.[0]?.created_by_role || "unknown",
            },
          });
        }
      });

      // 🧹 Limpiar formulario y refrescar lista
      setTitle("");
      setAssignedTo("");
      setServiceType("standard");
      setScheduledDate("");
      fetchJobs?.();
    } catch (err) {
      console.error("💥 Error creating job:", err);
      toast.error(err.message || "Error creating job");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4">
      <Input
        placeholder="Job title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Input
        type="date"
        value={scheduledDate}
        onChange={(e) => setScheduledDate(e.target.value)}
      />
      <Select value={assignedTo} onValueChange={setAssignedTo}>
        <SelectTrigger>
          {assignedTo
            ? staffList.find((s) => s.clerk_id === assignedTo)?.full_name ||
              "Assigned staff"
            : "Select staff"}
        </SelectTrigger>
        <SelectContent>
          {staffList.map((staff) => (
            <SelectItem key={staff.clerk_id} value={staff.clerk_id}>
              {staff.full_name || staff.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={serviceType} onValueChange={setServiceType}>
        <SelectTrigger className="capitalize">{serviceType}</SelectTrigger>
        <SelectContent>
          <SelectItem value="standard">Standard</SelectItem>
          <SelectItem value="deep">Deep</SelectItem>
          <SelectItem value="move-out">Move-out</SelectItem>
          <SelectItem value="add-ons">Add-ons</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={createJob} disabled={creating}>
        {creating ? "Creating..." : "Create Job"}
      </Button>
    </div>
  );
}
