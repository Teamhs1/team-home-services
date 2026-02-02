"use client";

import { useState, useEffect } from "react";
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
import { format } from "date-fns";

/* =======================
   HELPERS
======================= */
const isUUID = (v) =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );

export default function JobForm({
  staffList = [],
  companyList = [],
  fetchJobs,
}) {
  const [title, setTitle] = useState("");
  const [serviceType, setServiceType] = useState("standard"); // ✅ NUEVO
  const [assignedTo, setAssignedTo] = useState(""); // clerk_id
  const [companyId, setCompanyId] = useState("");
  const [clientId, setClientId] = useState(""); // profile UUID
  const [companyClients, setCompanyClients] = useState([]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [creating, setCreating] = useState(false);

  const isValid =
    title && scheduledDate && companyId && clientId && serviceType;

  /* =======================
     LOAD CLIENTS PER COMPANY
  ======================= */
  useEffect(() => {
    if (!companyId) {
      setCompanyClients([]);
      setClientId("");
      return;
    }

    async function loadClients() {
      try {
        const res = await fetch(`/api/admin/companies/${companyId}`, {
          cache: "no-store",
        });
        const data = await res.json();

        const validClients =
          data.members?.filter(
            (m) =>
              m.profile?.id &&
              isUUID(m.profile.id) &&
              ["admin", "owner", "client"].includes(m.role),
          ) || [];

        setCompanyClients(validClients);

        if (validClients.length > 0) {
          setClientId(validClients[0].profile.id);
        } else {
          setClientId("");
        }
      } catch (err) {
        console.error(err);
        setCompanyClients([]);
        setClientId("");
      }
    }

    loadClients();
  }, [companyId]);

  /* =======================
     SUBMIT
  ======================= */
  async function createJob() {
    if (!isValid || creating) return;

    if (!isUUID(clientId)) {
      toast.error("Invalid client selected");
      return;
    }

    setCreating(true);

    try {
      const res = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          property_address: title.trim(),
          service_type: serviceType,
          assigned_to: assignedTo || null,
          client_profile_id: clientId, // 🔥 ESTA ES LA LÍNEA CLAVE
          company_id: companyId,
          scheduled_date: format(new Date(scheduledDate), "yyyy-MM-dd"),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      fetchJobs?.();
      toast.success("Job created successfully");

      // reset
      setTitle("");
      setServiceType("standard");
      setAssignedTo("");
      setCompanyId("");
      setClientId("");
      setCompanyClients([]);
      setScheduledDate("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
      <div>
        <Label>Job Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div>
        <Label>Date</Label>
        <Input
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
        />
      </div>

      {/* ✅ SERVICE TYPE */}
      <div>
        <Label>Service Type</Label>
        <Select value={serviceType} onValueChange={setServiceType}>
          <SelectTrigger className="bg-white border border-gray-300 shadow-sm hover:border-gray-400 focus:ring-2 focus:ring-blue-500">
            <SelectValue placeholder="Select service type" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-xl">
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="deep">Deep Cleaning</SelectItem>
            <SelectItem value="move_out">Move Out</SelectItem>
            <SelectItem value="post_renovation">Post Renovation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Company</Label>
        <Select value={companyId} onValueChange={setCompanyId}>
          <SelectTrigger className="bg-white border border-gray-300 shadow-sm hover:border-gray-400 focus:ring-2 focus:ring-blue-500">
            <SelectValue placeholder="Select company" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-xl">
            {companyList.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Staff</Label>
        <Select value={assignedTo} onValueChange={setAssignedTo}>
          <SelectTrigger className="bg-white border border-gray-300 shadow-sm hover:border-gray-400 focus:ring-2 focus:ring-blue-500">
            <SelectValue placeholder="Select staff" />
          </SelectTrigger>

          <SelectContent className="bg-white border border-gray-200 shadow-xl">
            {staffList.map((s) => (
              <SelectItem key={s.clerk_id} value={s.clerk_id}>
                {s.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Client</Label>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger>
            <SelectValue placeholder="Select client" />
          </SelectTrigger>
          <SelectContent>
            {companyClients.map((c) => (
              <SelectItem key={c.profile.id} value={c.profile.id}>
                {c.profile.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end">
        <Button onClick={createJob} disabled={!isValid || creating}>
          {creating ? <Loader2 className="animate-spin" /> : "Create Job"}
        </Button>
      </div>
    </div>
  );
}
