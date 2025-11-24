"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, FileText } from "lucide-react";
import { useState } from "react";

export default function ClientRequestForm({ createJobRequest, loading }) {
  const [form, setForm] = useState({
    title: "",
    property_address: "",
    service_type: "",
    scheduled_date: "",
    notes: "",
  });

  const handleSubmit = () => {
    createJobRequest(form);
  };

  return (
    <Card className="border border-border/50 shadow-md rounded-xl p-4 sm:p-6">
      {/* Header - Igual estilo admin */}
      <CardHeader>
        <CardTitle className="text-2xl">Request a Cleaning</CardTitle>
        <CardDescription>
          Complete the information below to create a cleaning request.
        </CardDescription>
      </CardHeader>

      {/* Contenido del formulario */}
      <CardContent className="space-y-6">
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Cleaning Title</label>
            <input
              className="border rounded-md p-2 w-full mt-1"
              placeholder="e.g. Deep Cleaning"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Property Address</label>
            <div className="relative mt-1">
              <input
                className="border rounded-md p-2 w-full pl-10"
                placeholder="Enter address"
                value={form.property_address}
                onChange={(e) =>
                  setForm({ ...form, property_address: e.target.value })
                }
              />
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Service Type</label>
            <select
              className="border rounded-md p-2 w-full mt-1"
              value={form.service_type}
              onChange={(e) =>
                setForm({ ...form, service_type: e.target.value })
              }
            >
              <option value="">Select type</option>
              <option value="standard">Standard Cleaning</option>
              <option value="deep">Deep Cleaning</option>
              <option value="move-out">Move-out Cleaning</option>
              <option value="add-ons">Add-ons</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Scheduled Date</label>
            <div className="relative mt-1">
              <input
                type="date"
                className="border rounded-md p-2 w-full pl-10"
                value={form.scheduled_date}
                onChange={(e) =>
                  setForm({ ...form, scheduled_date: e.target.value })
                }
              />
              <CalendarDays className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium">Additional Notes</label>
          <div className="relative mt-1">
            <textarea
              className="border rounded-md p-2 w-full h-28 resize-none pl-10"
              placeholder="Optional notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <FileText className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            disabled={
              !form.title ||
              !form.property_address ||
              !form.service_type ||
              !form.scheduled_date
            }
            onClick={handleSubmit}
            className="px-8"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
