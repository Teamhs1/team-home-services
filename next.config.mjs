/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // ✅ evita 400 Bad Request con Supabase URLs
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "kgwpkqtidepwmdmmmsvg.supabase.co",
        pathname: "/storage/v1/object/public/job-photos/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  // 🔑 FIX: redirigir www → sin www (evita Redirect error en Google)
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.teamhomeservices.ca",
          },
        ],
        destination: "https://teamhomeservices.ca/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
