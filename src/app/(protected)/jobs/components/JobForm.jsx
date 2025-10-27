"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/utils/supabase/client";

export default function JobForm({ staffList, getToken }) {
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [serviceType, setServiceType] = useState("standard");
  const [scheduledDate, setScheduledDate] = useState("");
  const [creating, setCreating] = useState(false);

  async function createJob() {
    if (!title || !scheduledDate)
      return toast.warning("Please fill all fields");

    setCreating(true);
    try {
      const token = await getToken({ template: "supabase" });

      // 🚀 Crear el job real en la base de datos
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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("✅ Job created successfully!");

      // 📡 Crear canal, suscribirse y enviar broadcast global
      const channel = supabase.channel("realtime_jobs_admin_global");

      channel
        .on("broadcast", { event: "ack" }, () =>
          console.log("📬 Broadcast acknowledged by admin")
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("📡 Canal listo, enviando broadcast...");

            channel.send({
              type: "broadcast",
              event: "job_created",
              payload: {
                title,
                service_type: serviceType,
                created_at: new Date().toISOString(),
              },
            });

            console.log(
              "📢 Broadcast enviado al canal realtime_jobs_admin_global"
            );
          }
        });

      // 🧹 Limpiar formulario
      setTitle("");
      setAssignedTo("");
      setScheduledDate("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            ? staffList.find((s) => s.clerk_id === assignedTo)?.full_name
            : "Select staff"}
        </SelectTrigger>
        <SelectContent>
          {staffList.map((staff) => (
            <SelectItem key={staff.clerk_id} value={staff.clerk_id}>
              {staff.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={serviceType} onValueChange={setServiceType}>
        <SelectTrigger>{serviceType}</SelectTrigger>
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
