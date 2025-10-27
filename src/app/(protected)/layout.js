import "../globals.css";
import Sidebar from "@/components/Sidebar";
import GlobalNavbar from "@/components/GlobalNavbar";
import ProtectedLayoutClient from "./ProtectedLayoutClient";

export const metadata = {
  title: "Dashboard | Team Home Services",
  description: "Internal management dashboard",
};

export default function ProtectedLayout({ children }) {
  return (
    <div className="min-h-screen bg-muted/10 flex">
      {/* Sidebar fijo */}
      <Sidebar />

      {/* Cliente: maneja empuje dinámico */}
      <ProtectedLayoutClient>
        <GlobalNavbar />
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </ProtectedLayoutClient>
    </div>
  );
}
