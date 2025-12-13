"use client";

import { useState, useEffect } from "react";

/* =======================================================
   Convert HEX → Tailwind-friendly HSL number format
   ======================================================= */
function hexToHSL(hex) {
  hex = hex.replace("#", "");

  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  let cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin,
    h = 0,
    s = 0,
    l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

export default function ThemePreviewPage() {
  const defaultTheme = {
    brand: "#2563eb",
    accent: "#06b6d4",
    background: "#ffffff",
    text: "#1f2937",
  };

  const [theme, setTheme] = useState(defaultTheme);
  const [darkMode, setDarkMode] = useState(false);

  // 🆕 ADD: sidebar theme
  const [sidebarTheme, setSidebarTheme] = useState("dark");

  /* =======================================================
     Load saved theme
     ======================================================= */
  useEffect(() => {
    const savedTheme = localStorage.getItem("themeConfig");
    if (savedTheme) {
      const parsed = JSON.parse(savedTheme);
      setTheme(parsed);
      applyTheme(parsed);
    }

    const savedMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedMode);
    document.documentElement.classList.toggle("dark", savedMode);

    // 🆕 ADD: load sidebar theme
    const savedSidebar = localStorage.getItem("sidebarTheme");
    if (savedSidebar) {
      setSidebarTheme(savedSidebar);
    }
  }, []);

  /* =======================================================
     Apply theme → update REAL variables
     ======================================================= */
  const applyTheme = (t) => {
    const root = document.documentElement;

    root.style.setProperty("--primary", hexToHSL(t.brand));
    root.style.setProperty("--accent", hexToHSL(t.accent));
    root.style.setProperty("--background", hexToHSL(t.background));
    root.style.setProperty("--foreground", hexToHSL(t.text));
  };

  const handleColorChange = (key, value) => {
    const updated = { ...theme, [key]: value };
    setTheme(updated);
    applyTheme(updated);
    localStorage.setItem("themeConfig", JSON.stringify(updated));
  };

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
    localStorage.setItem("darkMode", newMode);
  };

  // 🆕 ADD: update sidebar theme
  const updateSidebarTheme = (value) => {
    setSidebarTheme(value);
    localStorage.setItem("sidebarTheme", value);
  };

  /* =======================================================
     UI
     ======================================================= */

  return (
    <main className="p-6 pt-28 pb-20 transition-colors duration-300 bg-[hsl(var(--background))] min-h-screen">
      {/* TOP BAR */}
      <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-30 h-16 flex items-center justify-between px-6 shadow-sm">
        <h1 className="font-semibold text-lg text-[hsl(var(--foreground))] flex items-center gap-2">
          🎨 Theme Editor
          <span className="text-sm text-gray-500 dark:text-gray-400 font-normal hidden sm:inline">
            — Live preview & brand adjustments
          </span>
        </h1>

        <button
          onClick={toggleTheme}
          className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      {/* 🆕 ADD: SIDEBAR THEME */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(var(--primary))]">
          Sidebar Theme
        </h2>

        <div className="flex gap-4">
          {["dark", "light"].map((opt) => (
            <button
              key={opt}
              onClick={() => updateSidebarTheme(opt)}
              className={`px-4 py-2 rounded-md border font-medium transition ${
                sidebarTheme === opt
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {opt.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      {/* ================= EXISTING CONTENT BELOW (UNTOUCHED) ================= */}

      {/* PAGE HEADER */}
      <header className="mb-10">
        <h2 className="text-3xl font-bold text-[hsl(var(--foreground))]">
          Team Home Services Theme
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Adjust your brand colors and instantly preview the design system.
        </p>
      </header>

      {/* THEME PICKERS */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(var(--primary))]">
          Theme Colors
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {Object.entries(theme).map(([key, value]) => (
            <div
              key={key}
              className="p-4 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex flex-col items-center gap-3"
            >
              <label className="capitalize font-semibold text-[hsl(var(--foreground))]">
                {key}
              </label>

              <input
                type="color"
                value={value}
                onChange={(e) => handleColorChange(key, e.target.value)}
                className="w-16 h-16 rounded-full cursor-pointer border"
              />

              <span className="text-xs text-gray-500">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* BUTTONS */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(var(--primary))]">
          Buttons
        </h2>

        <div className="flex flex-wrap gap-4">
          <button
            className="px-4 py-2 rounded-md font-medium text-white"
            style={{
              backgroundColor: `hsl(${hexToHSL(theme.brand)})`,
            }}
          >
            Primary
          </button>

          <button
            className="px-4 py-2 rounded-md font-medium border"
            style={{
              borderColor: `hsl(${hexToHSL(theme.brand)})`,
              color: `hsl(${hexToHSL(theme.brand)})`,
            }}
          >
            Outline
          </button>

          <button
            className="px-4 py-2 rounded-md font-medium text-white"
            style={{
              backgroundColor: `hsl(${hexToHSL(theme.accent)})`,
            }}
          >
            Accent
          </button>

          <button className="px-4 py-2 rounded-md font-medium text-white bg-green-600">
            Success
          </button>
        </div>
      </section>

      {/* BADGES — MATCH REAL UI COLORS */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(var(--primary))]">
          Status Badges
        </h2>

        <div className="flex gap-4 flex-wrap">
          {/* REAL Pending */}
          <span
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: `hsl(var(--status-pending-bg))`,
              color: `hsl(var(--status-pending-text))`,
            }}
          >
            Pending
          </span>

          {/* REAL In Progress */}
          <span
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: `hsl(var(--status-progress-bg))`,
              color: `hsl(var(--status-progress-text))`,
            }}
          >
            In Progress
          </span>

          {/* REAL Completed */}
          <span
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: `hsl(var(--status-completed-bg))`,
              color: `hsl(var(--status-completed-text))`,
            }}
          >
            Completed
          </span>
        </div>
      </section>

      {/* CARDS */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(var(--primary))]">
          Cards
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-lg border hover:shadow transition bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              style={{
                borderColor: `hsl(${hexToHSL(theme.brand)})`,
              }}
            >
              <h3 className="font-semibold mb-2 text-[hsl(var(--foreground))]">
                Example Card {i}
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                This is a card preview using your current color theme.
              </p>

              <button
                className="mt-3 px-3 py-1 rounded-md text-sm font-medium"
                style={{
                  backgroundColor: `hsl(${hexToHSL(theme.brand)})`,
                  color: "#fff",
                }}
              >
                View
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* TYPOGRAPHY */}
      <section className="mb-20">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(var(--primary))]">
          Typography
        </h2>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-[hsl(var(--foreground))]">
            Heading 1
          </h1>

          <h2 className="text-3xl font-semibold text-[hsl(var(--foreground))]">
            Heading 2
          </h2>

          <p
            className="text-base"
            style={{ color: `hsl(${hexToHSL(theme.text)})` }}
          >
            This is a sample paragraph showing how your brand text color looks
            in combination with background and accent tones.
          </p>
        </div>
      </section>
    </main>
  );
}
