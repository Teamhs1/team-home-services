import { ClerkProvider } from "@clerk/nextjs";
import { SupabaseProvider } from "@/contexts/SupabaseContext";
import { SidebarProvider } from "@/components/SidebarContext";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import { Toaster } from "sonner";
import "@/app/globals.css";

export const metadata = {
  title: "Team Home Services",
  description: "Professional property & cleaning management platform",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className="min-h-screen bg-gray-50 text-gray-900 antialiased"
          suppressHydrationWarning
        >
          <SupabaseProvider>
            <SidebarProvider>
              {/* ✅ Navbar global visible solo en páginas públicas */}
              <ConditionalNavbar />

              {/* ✅ Contenido principal */}
              <main className="relative">{children}</main>

              {/* ✅ Notificaciones globales */}
              <Toaster position="bottom-right" richColors />
            </SidebarProvider>
          </SupabaseProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
