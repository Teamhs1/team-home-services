"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function CustomerJobForm({ onSubmit }) {
  const [form, setForm] = useState({
    title: "",
    property_address: "",
    service_type: "standard",
    scheduled_date: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.property_address || !form.scheduled_date) {
      return toast.warning("Please fill all required fields.");
    }

    setLoading(true);
    await onSubmit(form);
    setLoading(false);
    setForm({
      title: "",
      property_address: "",
      service_type: "standard",
      scheduled_date: "",
      notes: "",
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <Input
        placeholder="Cleaning Title (e.g. Deep Clean Apartment)"
        value={form.title}
        onChange={(e) => handleChange("title", e.target.value)}
      />
      <Input
        placeholder="Property Address"
        value={form.property_address}
        onChange={(e) => handleChange("property_address", e.target.value)}
      />
      <Select
        value={form.service_type}
        onValueChange={(val) => handleChange("service_type", val)}
      >
        <SelectTrigger>{form.service_type}</SelectTrigger>
        <SelectContent>
          <SelectItem value="standard">Standard</SelectItem>
          <SelectItem value="deep">Deep Cleaning</SelectItem>
          <SelectItem value="move-out">Move-out</SelectItem>
          <SelectItem value="add-ons">Add-ons</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={form.scheduled_date}
        onChange={(e) => handleChange("scheduled_date", e.target.value)}
      />
      <Textarea
        placeholder="Additional notes or details..."
        className="md:col-span-2"
        value={form.notes}
        onChange={(e) => handleChange("notes", e.target.value)}
      />
      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Send Request"}
        </Button>
      </div>
    </form>
  );
}
