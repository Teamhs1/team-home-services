"use client";

import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import AdminDashboard from "./AdminView";
import StaffView from "./StaffView";
import CustomerView from "./CustomerView";

export default function DashboardPage() {
  const { isLoaded, user } = useUser();

  const role = user?.publicMetadata?.role || "client";

  // 🚀 Loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  // 🧭 ADMIN
  if (role === "admin") {
    return (
      <main className="pt-32 md:pt-0 px-0 sm:px-6 md:px-12 lg:px-16 xl:px-20 max-w-[1600px] mx-auto space-y-10">
        <AdminDashboard />
      </main>
    );
  }

  // 🧭 STAFF
  if (role === "staff") {
    return <StaffView />;
  }

  // 🧭 CLIENT / CUSTOMER
  // 👉 CustomerView maneja su propio hook (useCustomerJobs)
  return <CustomerView />;
}
