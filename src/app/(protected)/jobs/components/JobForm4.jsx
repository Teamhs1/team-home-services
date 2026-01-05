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

export default function JobForm({
  staffList = [],
  companyList = [],
  fetchJobs,
}) {
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [clientId, setClientId] = useState("");
  const [companyClients, setCompanyClients] = useState([]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [creating, setCreating] = useState(false);

  const isValid = title && scheduledDate && companyId && clientId;

  /* =======================
     LOAD CLIENTS PER COMPANY
  ======================= */
  useEffect(() => {
    if (!companyId) {
      setCompanyClients([]);
      setClientId("");
      return;
    }

    async function loadCompanyClients() {
      try {
        const res = await fetch(`/api/admin/companies/${companyId}`, {
          cache: "no-store",
        });

        const data = await res.json();

        // 👇 SOLO perfiles con UUID (profiles.id)
        const clients =
          data.members?.filter(
            (m) =>
              m.profile?.id &&
              !m.profile.id.startsWith("user_") &&
              ["client", "owner", "admin"].includes(m.role)
          ) || [];

        setCompanyClients(clients);

        // auto-select primero válido
        if (clients.length > 0) {
          setClientId(clients[0].profile.id);
        }
      } catch (err) {
        console.error(err);
        setCompanyClients([]);
        setClientId("");
      }
    }

    loadCompanyClients();
  }, [companyId]);

  /* =======================
     SUBMIT
  ======================= */
  async function createJob() {
    if (!isValid || creating) return;

    setCreating(true);

    try {
      const res = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          assigned_to: assignedTo || null, // clerk_id ✅
          assigned_client: clientId, // UUID ✅
          company_id: companyId, // UUID ✅
          scheduled_date: format(new Date(scheduledDate), "yyyy-MM-dd"),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      fetchJobs?.();
      toast.success("Job created successfully");

      setTitle("");
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
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
