"use client";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useRouter } from "next/navigation";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TAX_RATE = 0.15; // 15% HST NB

export default function ExpensesPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  /* =====================
     ROLE (REAL SOURCE)
  ===================== */
  const [role, setRole] = useState(null);
  const [profileId, setProfileId] = useState(null);

  const [showMetrics, setShowMetrics] = useState(false);
  const [showChart, setShowChart] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const totalExpenses = expenses.length;
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [canViewExpenses, setCanViewExpenses] = useState(false);

  const [tax, setTax] = useState(0);
  const [finalCost, setFinalCost] = useState(0);
  const [openNewExpense, setOpenNewExpense] = useState(false);
  const [companies, setCompanies] = useState([]);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const [selectedCompany, setSelectedCompany] = useState("all");

  const [billingEnabled, setBillingEnabled] = useState(true);

  const isAdminLike = role === "admin" || role === "super_admin";
  const filteredExpenses =
    role === "super_admin" && selectedCompany !== "all"
      ? expenses.filter((e) => e.company_id === selectedCompany)
      : expenses;

  const monthlyExpenses = filteredExpenses.filter((e) => {
    if (!e.expense_date) return false;
    const d = new Date(e.expense_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const yearlyExpenses = filteredExpenses.filter((e) => {
    if (!e.expense_date) return false;
    const d = new Date(e.expense_date);
    return d.getFullYear() === currentYear;
  });

  const monthlyChartData = Array.from({ length: 12 }, (_, i) => {
    const monthTotal = filteredExpenses
      .filter((e) => {
        if (!e.expense_date) return false;
        const d = new Date(e.expense_date);
        return d.getMonth() === i && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + Number(e.final_cost || e.amount || 0), 0);

    return {
      month: new Date(0, i).toLocaleString("default", { month: "short" }),
      total: monthTotal,
    };
  });
  const totalThisMonth = monthlyExpenses.reduce(
    (sum, e) => sum + Number(e.final_cost || e.amount || 0),
    0,
  );

  const totalThisYear = yearlyExpenses.reduce(
    (sum, e) => sum + Number(e.final_cost || e.amount || 0),
    0,
  );

  /* ===== LAST MONTH ===== */
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(currentMonth - 1);

  const lastMonthExpenses = filteredExpenses.filter((e) => {
    if (!e.expense_date) return false;
    const d = new Date(e.expense_date);
    return (
      d.getMonth() === lastMonthDate.getMonth() &&
      d.getFullYear() === lastMonthDate.getFullYear()
    );
  });

  const totalLastMonth = lastMonthExpenses.reduce(
    (sum, e) => sum + Number(e.final_cost || e.amount || 0),
    0,
  );

  const growth =
    totalLastMonth === 0
      ? totalThisMonth > 0
        ? 100
        : 0
      : ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100;

  /* =====================
   Cargar companies si es super_admin
===================== */

  useEffect(() => {
    if (role !== "super_admin") return;

    async function loadCompanies() {
      const res = await fetch("/api/admin/companies");
      const data = await res.json();
      if (res.ok) setCompanies(data);
    }

    loadCompanies();
  }, [role]);

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
   LOAD BILLING STATUS
===================== */
  useEffect(() => {
    async function loadBilling() {
      try {
        const res = await fetch("/api/company/billing", {
          credentials: "include",
        });

        const text = await res.text();
        const data = text ? JSON.parse(text) : {};

        if (!res.ok) {
          console.error("Billing load failed:", data);
          return;
        }

        setBillingEnabled(data.billing_enabled ?? true);
      } catch (err) {
        console.error("Billing error:", err);
      }
    }

    loadBilling();
  }, []);
  /* =====================
   CHECK EXPENSE PERMISSION
===================== */
  useEffect(() => {
    if (!role || !profileId) return;

    // 👑 SUPER ADMIN → siempre puede
    if (role === "super_admin") {
      setCanViewExpenses(true);
      return;
    }

    // 🧑‍💼 ADMIN → siempre puede
    if (role === "admin" || role === "super_admin") {
      setCanViewExpenses(true);
      return;
    }

    // 🏢 CLIENT → puede ver sus expenses
    if (role === "client") {
      setCanViewExpenses(true);
      return;
    }

    // 👷 STAFF → validar permiso real
    async function checkPermission() {
      try {
        const res = await fetch("/api/permissions/me", {
          cache: "no-store",
        });

        if (!res.ok) {
          setCanViewExpenses(false);
          return;
        }

        const data = await res.json();

        const expensePermission = data.permissions?.find(
          (p) => p.resource === "expenses",
        );

        setCanViewExpenses(!!expensePermission?.can_view);
      } catch (err) {
        console.error("PERMISSION CHECK ERROR:", err);
        setCanViewExpenses(false);
      }
    }

    checkPermission();
  }, [role, profileId]);
  /**--------Tax------------ */
  useEffect(() => {
    const amt = Number(amount) || 0;
    const calculatedTax = amt * TAX_RATE;

    setTax(calculatedTax);
    setFinalCost(amt + calculatedTax);
  }, [amount]);

  /* =====================
     LOAD PROPERTIES
  ===================== */
  async function loadProperties() {
    try {
      const res = await fetch("/api/properties", {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        toast.error("Failed to load properties");
        return;
      }

      setProperties(Array.isArray(data.properties) ? data.properties : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load properties");
    }
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
    if (!isLoaded || !canViewExpenses) return;
    loadProperties();
  }, [isLoaded, canViewExpenses]);

  /* =====================
     LOAD EXPENSES
  ===================== */
  useEffect(() => {
    if (!isLoaded || !profileId || !role) return;
    if (!canViewExpenses) return;

    loadExpenses();
  }, [isLoaded, profileId, role, canViewExpenses]);

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

  /* =====================
     SUBMIT EXPENSE
  ===================== */
  async function submitExpense() {
    if (submitting) return;
    setSubmitting(true);

    if (!billingEnabled) {
      toast.error("Billing is disabled for this company");
      setSubmitting(false);
      return;
    }

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
      formData.append("tax", tax);
      formData.append("final_cost", finalCost);

      formData.append("property_id", selectedProperty);
      formData.append("unit_id", selectedUnit);
      formData.append("file", file);

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
      setTax(0);
      setFinalCost(0);

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
  if (!role) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }
  if (!canViewExpenses) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        You do not have permission to view expenses.
      </div>
    );
  }

  /* =====================
   EXPORT HELPERS
===================== */

  const expensesToExport =
    selectedExpenses.size > 0
      ? filteredExpenses.filter((e) => selectedExpenses.has(e.id))
      : filteredExpenses;

  /* ===== EXCEL ===== */
  async function exportToExcel() {
    if (expensesToExport.length === 0) {
      toast.info("No expenses to export");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Expenses", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    /* ===== HEADER ===== */
    sheet.columns = [
      { header: "Date", key: "date", width: 14 },
      { header: "Property", key: "property", width: 32 },
      { header: "Unit", key: "unit", width: 12 },
      { header: "Description", key: "description", width: 40 },
      { header: "Staff", key: "staff", width: 22 },
      { header: "Amount", key: "amount", width: 14 },
      { header: "Tax", key: "tax", width: 14 },
      { header: "Final Cost", key: "final", width: 16 },
    ];

    /* ===== HEADER STYLE ===== */
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE5E7EB" }, // gray-200
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    /* ===== DATA ROWS ===== */
    expensesToExport.forEach((e) => {
      sheet.addRow({
        date: e.expense_date
          ? new Date(e.expense_date).toLocaleDateString()
          : "",
        property: propertyMap[e.property_id] || "",
        unit: e.unit?.unit ? `Unit ${e.unit.unit}` : "",
        description: e.description,
        staff: e.contractor_name || "",
        amount: Number(e.amount),
        tax: Number(e.tax || 0),
        final: Number(e.final_cost || e.amount),
      });
    });

    /* ===== CURRENCY FORMAT ===== */
    ["F", "G", "H"].forEach((col) => {
      sheet.getColumn(col).numFmt = '"$"#,##0.00';
    });

    /* ===== BORDERS FOR ALL ROWS ===== */
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    /* ===== TOTALS ROW ===== */
    const totalRow = sheet.addRow({
      description: "TOTAL",
      amount: {
        formula: `SUM(F2:F${sheet.rowCount})`,
      },
      tax: {
        formula: `SUM(G2:G${sheet.rowCount})`,
      },
      final: {
        formula: `SUM(H2:H${sheet.rowCount})`,
      },
    });

    totalRow.font = { bold: true };

    totalRow.eachCell((cell) => {
      cell.border = {
        top: { style: "double" },
        left: { style: "thin" },
        bottom: { style: "double" },
        right: { style: "thin" },
      };
    });

    /* ===== EXPORT ===== */
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "expenses.xlsx");
  }

  /* ===== PDF ===== */
  function exportToPDF() {
    if (expensesToExport.length === 0) {
      toast.info("No expenses to export");
      return;
    }

    const doc = new jsPDF("l", "pt"); // landscape

    doc.setFontSize(14);
    doc.text("Expenses Report", 40, 30);

    const tableData = expensesToExport.map((e) => [
      e.expense_date ? new Date(e.expense_date).toLocaleDateString() : "",
      propertyMap[e.property_id] || "",
      e.unit?.unit ? `Unit ${e.unit.unit}` : "",
      e.description,
      e.contractor_name || "",
      `$${Number(e.amount).toFixed(2)}`,
      `$${Number(e.tax || 0).toFixed(2)}`,
      `$${Number(e.final_cost || e.amount).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 50,
      head: [
        [
          "Date",
          "Property",
          "Unit",
          "Description",
          "Staff",
          "Amount",
          "Tax",
          "Final Cost",
        ],
      ],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 163, 74] },
    });

    doc.save("expenses.pdf");
  }

  /* =====================
     RENDER
  ===================== */
  return (
    <>
      {/* MODAL: NEW EXPENSE */}
      <Dialog open={openNewExpense} onOpenChange={setOpenNewExpense}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Expense</DialogTitle>
          </DialogHeader>

          <ExpenseForm
            mode={role}
            onSuccess={() => {
              setOpenNewExpense(false);
              loadExpenses();
            }}
          />
        </DialogContent>
      </Dialog>

      <main className="mt-16 px-4 sm:px-6 py-6 sm:py-10 max-w-[1400px] mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold">💸 Expenses</h1>
            <p className="text-sm text-muted-foreground">
              {totalExpenses} expense{totalExpenses !== 1 && "s"}
            </p>
          </div>
          {!billingEnabled && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              Billing is disabled for this company. New expenses cannot be
              created.
            </div>
          )}
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowMetrics((prev) => !prev)}
            >
              {showMetrics ? "Hide Metrics" : "Show Metrics"}
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowChart((prev) => !prev)}
            >
              {showChart ? "Hide Chart" : "Show Chart"}
            </Button>

            {canViewExpenses && billingEnabled && (
              <Button onClick={() => setOpenNewExpense(true)}>➕ New</Button>
            )}

            {filteredExpenses.length > 0 && (
              <>
                <Button variant="outline" onClick={exportToExcel}>
                  📊 Export Excel
                </Button>

                <Button variant="outline" onClick={exportToPDF}>
                  📄 Export PDF
                </Button>
              </>
            )}
          </div>
        </div>

        {/* FINANCIAL STATS */}
        {showMetrics && filteredExpenses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>💰 This Month</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                ${totalThisMonth.toFixed(2)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📅 This Year</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                ${totalThisYear.toFixed(2)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📈 Growth vs Last Month</CardTitle>
              </CardHeader>
              <CardContent
                className={`text-2xl font-bold ${
                  growth >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {growth.toFixed(1)}%
              </CardContent>
            </Card>
          </div>
        )}
        {/* STATS CARDS */}
        {expenses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Expenses</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                {expenses.length}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Amount</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                $
                {expenses
                  .reduce((sum, e) => sum + Number(e.amount || 0), 0)
                  .toFixed(2)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Final Cost</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                $
                {expenses
                  .reduce(
                    (sum, e) => sum + Number(e.final_cost || e.amount || 0),
                    0,
                  )
                  .toFixed(2)}
              </CardContent>
            </Card>
          </div>
        )}
        {/* MONTHLY CHART */}
        {showChart && filteredExpenses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Monthly Expenses ({currentYear})</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" />
                </BarChart>
              </ResponsiveContainer>
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
        {isAdminLike && selectedExpenses.size > 0 && (
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
                  {isAdminLike && (
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
                  <th className="px-4 py-2 text-left">Staff</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 text-right">Tax</th>

                  <th className="px-4 py-2 text-right">Final Cost</th>

                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredExpenses.map((e) => (
                  <tr
                    key={e.id}
                    className="border-t hover:bg-gray-50 transition-colors"
                  >
                    {isAdminLike && (
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
                      {e.property?.address || "—"}
                    </td>
                    {/* UNIT */}
                    <td className="px-4 py-3 text-left text-sm text-gray-700">
                      {e.unit?.unit ? `Unit ${e.unit.unit}` : "—"}
                    </td>

                    {/* DESCRIPTION */}
                    <td className="px-4 py-3 text-left text-sm text-gray-900">
                      {e.description}
                    </td>

                    {/* STAFF */}
                    <td className="px-4 py-3 text-left text-sm text-gray-600">
                      {e.contractor_name || "—"}
                    </td>

                    {/* AMOUNT */}
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                      ${Number(e.amount).toFixed(2)}
                    </td>

                    {/* TAX */}
                    <td className="px-4 py-3 text-right text-gray-700">
                      ${Number(e.tax || 0).toFixed(2)}
                    </td>

                    {/* FINAL COST */}
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      ${Number(e.final_cost || e.amount).toFixed(2)}
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
    </>
  );
}
