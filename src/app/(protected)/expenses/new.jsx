"use client";

import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import PermissionGuard from "@/components/PermissionGuard";

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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";

export default function ExpensesPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const canAssignStaff = role === "admin" || role === "client";

  /* =====================
     ROLE (REAL SOURCE)
  ===================== */
  const [role, setRole] = useState(null);
  const [profileId, setProfileId] = useState(null);

  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");

  /* =====================
   BULK SELECTION
===================== */
  const [selectedExpenses, setSelectedExpenses] = useState(new Set());

  const toggleExpenseSelection = (id) => {
    setSelectedExpenses((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedExpenses(new Set());

  const isSelected = (id) => selectedExpenses.has(id);

  /* =====================
     LOAD ROLE (API /me)
  ===================== */
  useEffect(() => {
    if (!user?.id) return;

    async function fetchMe() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch /api/me");

        const data = await res.json();
        setRole(data.role);
        setProfileId(data.id);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile");
      }
    }

    fetchMe();
  }, [user?.id]);

  /* =====================
     SUPABASE CLIENT
  ===================== */
  async function getSupabase() {
    const token = await getToken({ template: "supabase" });
    if (!token) throw new Error("No Supabase token");

    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      },
    );
  }

  /* =====================
     LOAD PROPERTIES
  ===================== */
  async function loadProperties() {
    const supabase = await getSupabase();

    const { data, error } = await supabase
      .from("properties")
      .select("id, address")
      .order("address");

    if (error) {
      console.error(error);
      toast.error("Failed to load properties");
      return;
    }

    setProperties(data || []);
  }
  async function loadUnits(propertyId) {
    if (!propertyId) {
      setUnits([]);
      return;
    }

    try {
      const res = await fetch(`/api/units/list?property_id=${propertyId}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        toast.error("Failed to load units");
        return;
      }

      setUnits(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load units");
    }
  }
  useEffect(() => {
    if (!isLoaded || !canAssignStaff) return;

    async function loadStaff() {
      try {
        const res = await fetch("/api/company/staff", {
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error("Failed to load staff");
          return;
        }

        setStaffMembers(data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load staff");
      }
    }

    loadStaff();
  }, [isLoaded, canAssignStaff]);

  /* =====================
     LOAD EXPENSES
  ===================== */

  async function loadExpenses() {
    try {
      const res = await fetch("/api/expenses/list", {
        credentials: "include",
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : [];

      if (!res.ok) {
        console.error("LOAD EXPENSES ERROR:", data);
        toast.error("Failed to load expenses");
        return;
      }

      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("LOAD EXPENSES EXCEPTION:", err);
      toast.error("Failed to load expenses");
    }
  }

  useEffect(() => {
    if (!isLoaded || !role || !profileId) return;
    loadExpenses();
  }, [isLoaded, role, profileId]);

  useEffect(() => {
    if (!isLoaded || !role) return;
    loadProperties();
  }, [isLoaded, role]);

  /* =====================
     DELETE EXPENSES
  ===================== */
  async function deleteExpense(expenseId) {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      const res = await fetch("/api/expenses/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ expenseId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Failed to delete expense");
        return;
      }

      toast.success("Expense deleted");
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete expense");
    }
  }
  /* =====================
   DELETE EXPENSES BULK
===================== */
  async function deleteExpensesBulk() {
    if (selectedExpenses.size === 0) return;

    if (
      !confirm(
        `Delete ${selectedExpenses.size} selected expense(s)? This action cannot be undone.`,
      )
    )
      return;

    try {
      const res = await fetch("/api/expenses/delete-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ids: Array.from(selectedExpenses),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Failed to delete expenses");
        return;
      }

      toast.success(`${data.count} expense(s) deleted`);
      clearSelection();
      loadExpenses();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete expenses");
    }
  }
  if (canAssignStaff && !selectedStaff) {
    toast.error("Please assign this expense to a staff member");
    setSubmitting(false);
    return;
  }

  /* =====================
     SUBMIT EXPENSE
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
        toast.error("Missing fields");
        return;
      }

      const formData = new FormData();
      formData.append("amount", amount);
      formData.append("description", description);
      formData.append("property_id", selectedProperty);
      formData.append("unit_id", selectedUnit);
      formData.append("file", file);
      formData.append(
        "contractor_id",
        canAssignStaff && selectedStaff ? selectedStaff : profileId,
      );

      formData.append("created_by", profileId);

      console.log("SUBMIT DATA:", {
        amount,
        description,
        selectedProperty,
        selectedUnit,
        fileName: file?.name,
      });

      const res = await fetch("/api/expenses/create", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      let json = {};
      try {
        json = await res.json();
      } catch (e) {
        json = {};
      }

      if (!res.ok) {
        console.error("API error:", res.status, json);
        toast.error(json?.error || `Failed to submit expense (${res.status})`);
        return;
      }

      toast.success("Expense submitted");

      setAmount("");
      setDescription("");
      setFile(null);
      setSelectedProperty("");
      setSelectedUnit("");
      setUnits([]);

      loadExpenses();
    } finally {
      setSubmitting(false); // 👈 ESTO FALTABA
    }
  }

  const propertyMap = properties.reduce((acc, p) => {
    acc[p.id] = p.address;
    return acc;
  }, {});
  /* =====================
     GUARD
  ===================== */
  if (!role || !profileId) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  /* =====================
     RENDER
  ===================== */
  return (
    <PermissionGuard
      resource="expenses"
      title="Expenses access removed"
      message="You no longer have access to Expenses. Please contact your administrator if you believe this is a mistake."
    >
      <main className="px-4 sm:px-6 py-6 sm:py-10 max-w-[1400px] mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-3xl font-bold">💸 Expenses</h1>
        </div>

        {/* CREATE EXPENSE */}
        {(role === "staff" || role === "client") && (
          <Card className="max-w-md border shadow-md rounded-xl">
            <CardHeader>
              <CardTitle>Submit Expense</CardTitle>
              <CardDescription>
                Upload an expense linked to a property
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {canAssignStaff && (
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full border rounded-md p-2 text-sm"
                >
                  <option value="">Assign to staff</option>
                  {staffMembers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={selectedProperty}
                onChange={(e) => {
                  const propertyId = e.target.value;
                  setSelectedProperty(propertyId);
                  setSelectedUnit(""); // reset unit
                  loadUnits(propertyId); // cargar units
                }}
                className="w-full border rounded-md p-2 text-sm"
              >
                <option value="">Select property</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.address}
                  </option>
                ))}
              </select>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full border rounded-md p-2 text-sm"
                disabled={!selectedProperty}
              >
                <option value="">Select unit</option>

                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    Unit {u.unit}
                  </option>
                ))}
              </select>

              <Input
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              <Input
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <Input type="file" onChange={(e) => setFile(e.target.files[0])} />

              <Button onClick={submitExpense} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Expense"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* EMPTY STATE */}
        {expenses.length === 0 && (
          <div className="text-center text-gray-500 py-20">
            No expenses found.
          </div>
        )}
        {/* BULK ACTION BAR */}
        {role === "admin" && selectedExpenses.size > 0 && (
          <div className="sticky top-2 z-20 bg-white border shadow-sm rounded-lg px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedExpenses.size} expense(s) selected
            </span>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-200"
                onClick={deleteExpensesBulk}
              >
                🗑️ Delete
              </Button>

              <Button size="sm" variant="ghost" onClick={clearSelection}>
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* TABLE */}
        {expenses.length > 0 && (
          <div className="bg-white shadow rounded-lg border overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  {role === "admin" && (
                    <th className="px-4 py-2 w-10">
                      <input
                        type="checkbox"
                        checked={
                          expenses.length > 0 &&
                          expenses.every((e) => selectedExpenses.has(e.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedExpenses(
                              new Set(expenses.map((e) => e.id)),
                            );
                          } else {
                            clearSelection();
                          }
                        }}
                      />
                    </th>
                  )}

                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Property</th>
                  <th className="px-4 py-2 text-left">Unit</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 text-left">Staff</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((e) => (
                  <tr
                    key={e.id}
                    className="border-t hover:bg-gray-50 transition-colors"
                  >
                    {role === "admin" && (
                      <td
                        className="px-4 py-3"
                        onClick={(ev) => ev.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected(e.id)}
                          onChange={() => toggleExpenseSelection(e.id)}
                        />
                      </td>
                    )}

                    {/* DATE */}
                    <td className="px-4 py-3 text-left text-sm text-gray-700 whitespace-nowrap">
                      {e.expense_date
                        ? new Date(e.expense_date).toLocaleDateString()
                        : "—"}
                    </td>

                    {/* PROPERTY */}
                    <td className="px-4 py-3 text-left text-sm text-gray-700 max-w-xs truncate">
                      {propertyMap[e.property_id] || "—"}
                    </td>
                    {/* UNIT */}
                    <td className="px-4 py-3 text-left text-sm text-gray-700">
                      {e.unit?.unit ? `Unit ${e.unit.unit}` : "—"}
                    </td>

                    {/* DESCRIPTION */}
                    <td className="px-4 py-3 text-left text-sm text-gray-900">
                      {e.description}
                    </td>

                    {/* AMOUNT */}
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                      ${Number(e.amount).toFixed(2)}
                    </td>

                    {/* STAFF */}
                    <td className="px-4 py-3 text-left text-sm text-gray-600">
                      {e.contractor_name || "—"}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          {e.invoice_url && (
                            <DropdownMenuItem asChild>
                              <a
                                href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/expense-invoices/${e.invoice_url}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                📎 View Invoice
                              </a>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              if (selectedExpenses.size > 0) {
                                toast.info(
                                  "Use bulk actions to delete multiple expenses",
                                );
                                return;
                              }
                              deleteExpense(e.id);
                            }}
                          >
                            🗑️ Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </PermissionGuard>
  );
}
