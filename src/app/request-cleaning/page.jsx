"use client";

import ClientRequestForm from "@/components/ClientRequestForm";
import { useUser, useAuth } from "@clerk/nextjs";
import { useCustomerJobs } from "@/app/(protected)/jobs/hooks/useCustomerJobs";

export default function RequestCleaningPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const clerkId = user?.id;

  // 🟦 Aquí obtenemos la función real createJobRequest
  const { createJobRequest, loading } = useCustomerJobs({ getToken, clerkId });

  return (
    <main className="px-6 md:px-12 lg:px-16 xl:px-20 py-10 max-w-[1600px] mx-auto">
      <ClientRequestForm
        createJobRequest={createJobRequest} // 🟩 AQUÍ LO PASAMOS ✔
        loading={loading}
      />
    </main>
  );
}
