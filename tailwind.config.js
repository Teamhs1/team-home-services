/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"], // Modo oscuro activable con classList.toggle('dark')
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🎨 Colores base del tema TeamHS
        primary: {
          DEFAULT: "#2563eb", // Azul corporativo
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#1e3a8a", // Azul profundo
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#3b82f6", // Azul intermedio (hover, detalles)
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f3f4f6",
          foreground: "#6b7280",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        background: "#f9fafb",
        foreground: "#111827",
        border: "#e5e7eb",
        input: "#e5e7eb",
        ring: "#2563eb",
        // Tonos personalizados para charts o badges
        chart: {
          1: "#2563eb",
          2: "#1e40af",
          3: "#60a5fa",
          4: "#93c5fd",
          5: "#bfdbfe",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "0 4px 10px rgba(0,0,0,0.06)",
      },
      transitionDuration: {
        DEFAULT: "300ms",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
