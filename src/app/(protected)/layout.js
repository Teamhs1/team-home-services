import "../globals.css";
import Sidebar from "@/components/Sidebar";
import GlobalNavbar from "@/components/GlobalNavbar";
import DashboardNavbar from "@/components/DashboardNavbar"; // 👈 nuevo import
import ProtectedLayoutClient from "./ProtectedLayoutClient";

export const metadata = {
  title: "Dashboard | Team Home Services",
  description: "Internal management dashboard",
};

export default function ProtectedLayout({ children }) {
  return (
    <div className="min-h-screen bg-muted/10 flex">
      {/* 🧭 Sidebar fijo */}
      <Sidebar />

      {/* ⚙️ Contenido principal con navbar y subnavbar */}
      <ProtectedLayoutClient>
        {/* 🔝 Navbar global superior */}
        <GlobalNavbar />

        {/* 🔹 Subnavbar contextual (Jobs, Admin, Settings...) */}
        <DashboardNavbar />

        {/* 📦 Contenido del dashboard */}
        <main className="pt-[112px] p-4 md:p-6 lg:p-8">{children}</main>
      </ProtectedLayoutClient>
    </div>
  );
}
