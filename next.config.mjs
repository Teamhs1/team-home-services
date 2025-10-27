/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com", // Clerk CDN
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev", // Clerk fallback
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com", // GitHub login
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google login avatars
      },
      {
        protocol: "https",
        hostname: "kgwpkqtidepwmdmmmsvg.supabase.co", // Supabase storage
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com", // 👈 para nombres sin avatar (errores actuales)
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", // 👈 fondos hero section
      },
    ],
  },
};

export default nextConfig;
