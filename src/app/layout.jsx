import { ClerkProvider } from "@clerk/nextjs";
import { SidebarProvider } from "@/components/SidebarContext";
import { SupabaseProvider } from "@/contexts/SupabaseContext";
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
        <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
          <SidebarProvider>
            <SupabaseProvider>
              <ConditionalNavbar />
              <main className="relative">{children}</main>
              <Toaster position="bottom-right" richColors />
            </SupabaseProvider>
          </SidebarProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
