"use client";

import { useEffect } from "react";
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
import { useStaff } from "../hooks/useStaff";
import { useClients } from "../hooks/useClients"; // ✅ NUEVO

export default function NewJobPage() {
  const router = useRouter();

  const { staffList, fetchStaff } = useStaff();
  const { clientList, fetchClients } = useClients(); // ✅ NUEVO

  // Cargar staff y clients
  useEffect(() => {
    fetchStaff();
    fetchClients();
  }, []);

  return (
    <main className="px-4 sm:px-6 py-6 sm:py-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10">
      {/* Botón Volver */}
      <Button
        variant="outline"
        onClick={() => router.push("/jobs")}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Button>

      {/* Título principal */}
      <h1 className="text-3xl font-bold">Crear Nuevo Trabajo</h1>
      <p className="text-gray-600">
        Completa la información para crear un nuevo job.
      </p>

      {/* FORMULARIO */}
      <Card className="border border-border/50 shadow-md rounded-xl p-2 sm:p-4">
        <CardHeader>
          <CardTitle>Create New Job</CardTitle>
          <CardDescription>Add a new cleaning job.</CardDescription>
        </CardHeader>

        {/* ✅ IMPORTANTE PARA MOBILE */}
        <CardContent className="overflow-visible">
          <JobForm
            staffList={staffList}
            clientList={clientList} // ✅ CLAVE
          />
        </CardContent>
      </Card>
    </main>
  );
}
