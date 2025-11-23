import { ClerkProvider } from "@clerk/nextjs";
import { SidebarProvider } from "@/components/SidebarContext";
import { SupabaseProvider } from "@/contexts/SupabaseContext";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import { Toaster } from "sonner";
import "@/app/globals.css";

export const metadata = {
  title: {
    default: "Team Home Services | Cleaning Services in Moncton NB",
    template: "%s | Team Home Services",
  },
  description:
    "Professional cleaning services in Moncton, Dieppe and Riverview. Move-out cleaning, deep cleaning, recurring cleaning and property-ready services for property managers.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Canonical URL */}
          <link rel="canonical" href="https://teamhomeservices.ca" />

          {/* Viewport */}
          <meta name="viewport" content="width=device-width, initial-scale=1" />

          {/* Keywords */}
          <meta
            name="keywords"
            content="
              cleaning services Moncton,
              house cleaning Moncton,
              move out cleaning NB,
              deep cleaning Dieppe,
              cleaners in Riverview,
              apartment cleaning Moncton,
              real estate cleaning NB,
              property management cleaning,
              Team Home Services,
              commercial cleaning Moncton
            "
          />

          {/* Open Graph */}
          <meta property="og:title" content="Team Home Services" />
          <meta
            property="og:description"
            content="Professional and reliable cleaning services in Moncton NB. Trusted by homeowners, landlords, and real estate agents."
          />
          <meta
            property="og:image"
            content="https://teamhomeservices.ca/logo.png"
          />
          <meta property="og:url" content="https://teamhomeservices.ca" />
          <meta property="og:type" content="website" />
          <meta property="og:locale" content="en_CA" />

          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Team Home Services" />
          <meta
            name="twitter:image"
            content="https://teamhomeservices.ca/logo.png"
          />

          {/* Preconnect */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin=""
          />

          {/* Preload main logo (LCP optimization) */}
          <link rel="preload" as="image" href="/logo.png" />

          {/* Structured Data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "LocalBusiness",
                name: "Team Home Services",
                image: "https://teamhomeservices.ca/logo.png",
                url: "https://teamhomeservices.ca",
                logo: "https://teamhomeservices.ca/logo.png",
                telephone: "+1-506-588-8517",
                priceRange: "$$",
                email: "info@teamhomeservices.ca",
                address: {
                  "@type": "PostalAddress",
                  streetAddress: "Moncton, NB",
                  addressLocality: "Moncton",
                  addressRegion: "NB",
                  postalCode: "E1C",
                  addressCountry: "CA",
                },
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: "46.0878",
                  longitude: "-64.7782",
                },
                areaServed: [
                  { "@type": "City", name: "Moncton" },
                  { "@type": "City", name: "Dieppe" },
                  { "@type": "City", name: "Riverview" },
                ],
                openingHoursSpecification: [
                  {
                    "@type": "OpeningHoursSpecification",
                    dayOfWeek: [
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ],
                    opens: "08:00",
                    closes: "18:00",
                  },
                ],
                sameAs: [
                  "https://www.facebook.com/teamhomeservices",
                  "https://www.instagram.com/teamhomeservices",
                  "https://www.linkedin.com/company/teamhomeservices",
                ],
              }),
            }}
          />
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
