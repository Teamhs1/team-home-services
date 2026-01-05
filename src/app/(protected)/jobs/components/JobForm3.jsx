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
   SERVICE TYPES
======================= */
const SERVICE_TYPES = [
  { value: "light", label: "Light Cleaning" },
  { value: "standard", label: "Standard Cleaning" },
  { value: "deep", label: "Deep Cleaning" },
  { value: "heavy", label: "Heavy Cleaning" },
  { value: "move-out", label: "Move-out / Move-in" },
  { value: "post-construction", label: "Post-Construction" },
  { value: "restoration", label: "Restoration" },
  { value: "renovation", label: "Renovation" },
  { value: "add-ons", label: "Add-ons Only" },
];

export default function JobForm({
  staffList = [],
  companyList = [],
  fetchJobs,
}) {
  /* =======================
     STATE
  ====================== */
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [clientId, setClientId] = useState("");
  const [companyAdmins, setCompanyAdmins] = useState([]);
  const [serviceType, setServiceType] = useState("standard");
  const [scheduledDate, setScheduledDate] = useState("");
  const [creating, setCreating] = useState(false);

  const isValid = Boolean(title && scheduledDate && companyId && clientId);

  /* =======================
     LOAD ADMINS PER COMPANY
  ====================== */
  useEffect(() => {
    if (!companyId) {
      setCompanyAdmins([]);
      setClientId("");
      return;
    }

    async function loadAdmins() {
      try {
        const res = await fetch(`/api/admin/companies/${companyId}`, {
          cache: "no-store",
        });

        const data = await res.json();

        const admins =
          data.members?.filter(
            (m) =>
              m.role === "admin" || m.role === "owner" || m.role === "client"
          ) || [];

        setCompanyAdmins(admins);

        // 🔒 AUTO-SELECT SOLO UUID VÁLIDO (NUNCA clerk_id)
        const ownerProfileId = data.owner?.profile?.id;

        if (ownerProfileId && !ownerProfileId.startsWith("user_")) {
          setClientId(ownerProfileId);
        } else {
          const validAdmin = admins.find(
            (a) => a?.profile?.id && !a.profile.id.startsWith("user_")
          );

          setClientId(validAdmin?.profile?.id || "");
        }
      } catch (err) {
        console.error("Failed to load company admins", err);
        setCompanyAdmins([]);
        setClientId("");
      }
    }

    loadAdmins();
  }, [companyId]);

  /* =======================
     SUBMIT
  ====================== */
  async function createJob() {
    if (!isValid || creating) return;

    if (!clientId) {
      toast.error("Client not selected");
      return;
    }

    // 🔒 PROTECCIÓN FINAL (BACKUP)
    if (clientId.startsWith("user_")) {
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
          assigned_to: assignedTo || null, // clerk_id
          assigned_client: clientId, // UUID
          company_id: companyId,
          service_type: serviceType,
          scheduled_date: format(new Date(scheduledDate), "yyyy-MM-dd"),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error creating job");

      fetchJobs?.();
      toast.success("Job created successfully");

      // reset (NO cambia comportamiento)
      setTitle("");
      setAssignedTo("");
      setCompanyId("");
      setClientId("");
      setCompanyAdmins([]);
      setScheduledDate("");
      setServiceType("standard");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  }

  /* =======================
     UI
  ====================== */
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
      {/* Job Title */}
      <div>
        <Label>Job Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      {/* Date */}
      <div>
        <Label>Date</Label>
        <Input
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
        />
      </div>

      {/* Company */}
      <div>
        <Label>Company</Label>
        <Select value={companyId} onValueChange={setCompanyId}>
          <SelectTrigger>
            <SelectValue placeholder="Select company" />
          </SelectTrigger>
          <SelectContent>
            {companyList.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Staff */}
      <div>
        <Label>Staff</Label>
        <Select value={assignedTo} onValueChange={setAssignedTo}>
          <SelectTrigger>
            <SelectValue placeholder="Select staff" />
          </SelectTrigger>
          <SelectContent>
            {staffList.map((s) => (
              <SelectItem key={s.clerk_id} value={s.clerk_id}>
                {s.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Client */}
      <div>
        <Label>Client (Company Contact)</Label>
        <Select value={clientId || ""} onValueChange={setClientId}>
          <SelectTrigger>
            <SelectValue placeholder="Primary contact" />
          </SelectTrigger>

          <SelectContent>
            {clientList.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Submit */}
      <div className="flex items-end">
        <Button onClick={createJob} disabled={!isValid || creating}>
          {creating ? <Loader2 className="animate-spin" /> : "Create Job"}
        </Button>
      </div>
    </div>
  );
}
