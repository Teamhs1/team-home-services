"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const TAX_RATE = 0.15;

export default function ExpenseForm({ mode = "staff", onSuccess }) {
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [staff, setStaff] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [selectedCompany, setSelectedCompany] = useState("");
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
     TAX CALC
  ===================== */
  useEffect(() => {
    const amt = Number(amount) || 0;
    setTax(amt * TAX_RATE);
    setFinalCost(amt + amt * TAX_RATE);
  }, [amount]);

  /* =====================
   LOAD INITIAL DATA
===================== */
  useEffect(() => {
    async function load() {
      try {
        /* ===== PROPERTIES ===== */
        const propsRes = await fetch("/api/properties", {
          credentials: "include",
          cache: "no-store",
        });

        if (!propsRes.ok) {
          toast.error("Failed to load properties");
          return;
        }

        const propsJson = await propsRes.json();
        const props = propsJson?.properties || propsJson;
        setProperties(Array.isArray(props) ? props : []);

        /* =========================================
         SUPER ADMIN → LOAD ALL COMPANIES
      ========================================= */
        if (mode === "super_admin") {
          const companiesRes = await fetch("/api/admin/companies", {
            credentials: "include",
            cache: "no-store",
          });

          if (!companiesRes.ok) {
            toast.error("Failed to load companies");
            return;
          }

          const companiesData = await companiesRes.json();
          const safeCompanies = Array.isArray(companiesData)
            ? companiesData
            : companiesData?.companies || [];

          setCompanies(safeCompanies);

          if (safeCompanies.length > 0) {
            setSelectedCompany(safeCompanies[0].id);
          }

          // Now load all staff separately
          const staffRes = await fetch("/api/admin/staff", {
            credentials: "include",
            cache: "no-store",
          });

          const staffData = await staffRes.json();
          setStaff(Array.isArray(staffData) ? staffData : []);

          return;
        }

        /* =========================================
         ADMIN / CLIENT → LOAD STAFF-BASED
      ========================================= */
        if (mode === "admin" || mode === "client") {
          const staffRes = await fetch("/api/admin/staff", {
            credentials: "include",
            cache: "no-store",
          });

          if (!staffRes.ok) {
            toast.error("Failed to load staff");
            return;
          }

          const staffData = await staffRes.json();
          const safeStaff = Array.isArray(staffData) ? staffData : [];
          setStaff(safeStaff);

          const uniqueCompanies = [
            ...new Map(
              safeStaff.map((m) => [
                m.company_id,
                {
                  id: m.company_id,
                  name: m.company_name || "Unnamed Company",
                },
              ]),
            ).values(),
          ];

          setCompanies(uniqueCompanies);

          if (uniqueCompanies.length > 0) {
            setSelectedCompany(uniqueCompanies[0].id);
          }
        }
      } catch (err) {
        console.error("LOAD FORM ERROR:", err);
        toast.error("Failed to load form data");
      }
    }

    load();
  }, [mode]);

  /* =====================
     LOAD UNITS
  ===================== */
  async function loadUnits(propertyId) {
    if (!propertyId) return setUnits([]);

    try {
      const res = await fetch(`/api/units/list?property_id=${propertyId}`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        toast.error("Failed to load units");
        return;
      }

      const data = await res.json();
      setUnits(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("LOAD UNITS ERROR:", err);
      toast.error("Failed to load units");
    }
  }

  /* =====================
     FILTERED STAFF
  ===================== */
  const filteredStaff =
    companies.length > 1
      ? staff.filter((m) => m.company_id === selectedCompany)
      : staff;

  const filteredProperties =
    companies.length > 1
      ? properties.filter((p) => p.company_id === selectedCompany)
      : properties;
  /* =====================
     SUBMIT
  ===================== */
  async function submitExpense() {
    if (submitting) return;
    setSubmitting(true);

    try {
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

      if (
        (mode === "admin" || mode === "client" || mode === "super_admin") &&
        !selectedStaff
      ) {
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

      if (mode === "admin" || mode === "client" || mode === "super_admin") {
        formData.append("contractor_id", selectedStaff);
      }

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

      setAmount("");
      setDescription("");
      setFile(null);
      setSelectedProperty("");
      setSelectedUnit("");
      setSelectedStaff("");
      setSelectedProperty(""); // 👈 RESET
      setSelectedUnit(""); // 👈 RESET
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
      {/* COMPANY */}
      {companies.length > 1 && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Company
          </label>
          <select
            value={selectedCompany}
            onChange={(e) => {
              setSelectedCompany(e.target.value);
              setSelectedStaff("");
            }}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* STAFF */}
      {(mode === "admin" || mode === "client" || mode === "super_admin") && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Staff
          </label>
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Select staff</option>
            {filteredStaff.map((m) => (
              <option key={`${m.id}-${m.company_id}`} value={m.id}>
                {m.full_name}
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
          {filteredProperties.map((p) => (
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
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      {/* ACTION */}
      <div className="pt-3 flex justify-end">
        <Button
          size="lg"
          className="px-8"
          onClick={submitExpense}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Expense"}
        </Button>
      </div>
    </div>
  );
}
