"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";

const TAX_RATE = 0.15;

export default function ExpenseForm({ mode = "staff", onSuccess }) {
  const { getToken } = useAuth();

  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [staff, setStaff] = useState([]);

  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);

  const [tax, setTax] = useState(0);
  const [finalCost, setFinalCost] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  /* =====================
     TAX
  ===================== */
  useEffect(() => {
    const amt = Number(amount) || 0;
    setTax(amt * TAX_RATE);
    setFinalCost(amt + amt * TAX_RATE);
  }, [amount]);

  async function getSupabase() {
    const token = await getToken({ template: "supabase" });
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
  }

  /* =====================
     LOAD INITIAL DATA
  ===================== */
  useEffect(() => {
    async function load() {
      try {
        const supabase = await getSupabase();

        // PROPERTIES
        const { data: props } = await supabase
          .from("properties")
          .select("id, address")
          .order("address");

        setProperties(props || []);

        // STAFF
        if (mode === "admin" || mode === "client") {
          const meRes = await fetch("/api/me", { credentials: "include" });
          const me = await meRes.json();

          if (!me.active_company_id) return;

          const res = await fetch(
            `/api/companies/${me.active_company_id}/members`,
            { credentials: "include" },
          );

          const json = await res.json();

          const members = Array.isArray(json.members) ? json.members : [];

          const staffOnly = members.filter((m) => m.role === "staff");

          setStaff(staffOnly);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data");
      }
    }

    load();
  }, [mode]);

  /* =====================
     LOAD UNITS
  ===================== */
  async function loadUnits(propertyId) {
    if (!propertyId) return setUnits([]);

    const res = await fetch(`/api/units/list?property_id=${propertyId}`, {
      credentials: "include",
    });

    const data = await res.json();
    setUnits(data || []);
  }

  /* =====================
   SUBMIT
===================== */
  async function submitExpense() {
    if (submitting) return;
    setSubmitting(true);

    try {
      // 🔒 VALIDACIÓN GENERAL
      if (
        !amount ||
        !description ||
        !file ||
        !selectedProperty ||
        !selectedUnit
      ) {
        toast.error("Please complete all required fields");
        return;
      }

      // 🔑 SOLO admin / client deben asignar staff
      if ((mode === "admin" || mode === "client") && !selectedStaff) {
        toast.error("Please select a staff member");
        return;
      }

      const formData = new FormData();
      formData.append("amount", amount);
      formData.append("tax", tax);
      formData.append("final_cost", finalCost);
      formData.append("description", description);
      formData.append("property_id", selectedProperty);
      formData.append("unit_id", selectedUnit);
      formData.append("file", file);

      // 🔑 contractor_id SOLO cuando aplica
      if (mode === "admin" || mode === "client") {
        formData.append("contractor_id", selectedStaff);
      }

      // 🎯 ENDPOINT CORRECTO SEGÚN ROL
      const endpoint =
        mode === "staff"
          ? "/api/expenses/create"
          : "/api/admin/expenses/create";

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json?.error || "Failed to submit expense");
        return;
      }

      toast.success("Expense created");
      onSuccess?.();

      // 🔄 RESET
      setAmount("");
      setDescription("");
      setFile(null);
      setSelectedProperty("");
      setSelectedUnit("");
      setSelectedStaff("");
      setUnits([]);
      setTax(0);
      setFinalCost(0);
    } finally {
      setSubmitting(false);
    }
  }

  /* =====================
     RENDER
  ===================== */
  return (
    <div className="space-y-5">
      {/* STAFF */}
      {mode !== "staff" && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Staff
          </label>
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select staff</option>
            {staff.map((m) => (
              <option key={m.profiles.id} value={m.profiles.id}>
                {m.profiles.full_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* PROPERTY */}
      <div>
        <label className="text-sm font-medium text-muted-foreground">
          Property
        </label>
        <select
          value={selectedProperty}
          onChange={(e) => {
            setSelectedProperty(e.target.value);
            setSelectedUnit("");
            loadUnits(e.target.value);
          }}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Select property</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.address}
            </option>
          ))}
        </select>
      </div>

      {/* UNIT */}
      <div>
        <label className="text-sm font-medium text-muted-foreground">
          Unit
        </label>
        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          disabled={!selectedProperty}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
        >
          <option value="">Select unit</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              Unit {u.unit}
            </option>
          ))}
        </select>
      </div>

      {/* AMOUNT */}
      <div>
        <label className="text-sm font-medium text-muted-foreground">
          Amount
        </label>
        <Input
          className="mt-1"
          placeholder="$0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      {/* TOTALS */}
      <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
        <div className="flex justify-between text-muted-foreground">
          <span>Tax (15%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>

        <div className="flex justify-between font-semibold text-base">
          <span>Final Cost</span>
          <span>${finalCost.toFixed(2)}</span>
        </div>
      </div>

      {/* DESCRIPTION */}
      <div>
        <label className="text-sm font-medium text-muted-foreground">
          Description
        </label>
        <Input
          className="mt-1"
          placeholder="Short description of the expense"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* FILE */}
      <div>
        <label className="text-sm font-medium text-muted-foreground">
          Invoice / Receipt
        </label>
        <Input
          className="mt-1"
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </div>

      {/* ACTION */}
      <div className="pt-3 flex justify-end">
        <Button
          size="lg"
          className="px-8"
          onClick={submitExpense}
          disabled={
            submitting ||
            !amount ||
            !description ||
            !file ||
            !selectedProperty ||
            !selectedUnit ||
            ((mode === "admin" || mode === "client") && !selectedStaff)
          }
        >
          {submitting ? "Submitting..." : "Submit Expense"}
        </Button>
      </div>
    </div>
  );
}
