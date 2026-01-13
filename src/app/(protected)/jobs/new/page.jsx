"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import JobForm from "../components/JobForm";

export default function NewJobPage() {
  const router = useRouter();

  /* =====================
     STAFF (LOCAL – like JobForm)
  ===================== */
  const [staffList, setStaffList] = useState([]);

  /* =====================
     COMPANIES (REQUIRED by JobForm)
  ===================== */
  const [companyList, setCompanyList] = useState([]);

  useEffect(() => {
    async function loadData() {
      // 🔹 Load staff
      try {
        const res = await fetch("/api/admin/staff", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setStaffList(data || []);
      } catch (err) {
        console.error("Error loading staff:", err);
        setStaffList([]);
      }

      // 🔹 Load companies (THIS WAS MISSING)
      try {
        const res = await fetch("/api/admin/companies", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setCompanyList(data || []);
      } catch (err) {
        console.error("Error loading companies:", err);
        setCompanyList([]);
      }
    }

    loadData();
  }, []);

  return (
    <main className="px-4 sm:px-6 py-6 sm:py-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10">
      {/* Back */}
      <Button
        variant="outline"
        onClick={() => router.push("/jobs")}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Button>

      {/* Header */}
      <h1 className="text-3xl font-bold">Crear Nuevo Trabajo</h1>
      <p className="text-gray-600">
        Completa la información para crear un nuevo job.
      </p>

      {/* FORM */}
      <Card className="border border-border/50 shadow-md rounded-xl p-2 sm:p-4">
        <CardHeader>
          <CardTitle>Create New Job</CardTitle>
          <CardDescription>Add a new cleaning job.</CardDescription>
        </CardHeader>

        <CardContent className="overflow-visible">
          <JobForm
            staffList={staffList} // ✅ OK
            companyList={companyList} // ✅ CLAVE (arregla Company)
          />
        </CardContent>
      </Card>
    </main>
  );
}
