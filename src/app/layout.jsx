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
        <head>
          <link rel="icon" href="/favicon.ico" />
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/apple-touch-icon.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="/favicon-16x16.png"
          />
          <link rel="manifest" href="/site.webmanifest" />
        </head>

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
