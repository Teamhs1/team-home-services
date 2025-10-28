"use client";

import { useState, useEffect } from "react";

export default function ThemePreviewPage() {
  const defaultTheme = {
    brand: "#2563eb",
    accent: "#06b6d4",
    background: "#ffffff",
    text: "#1f2937",
  };

  const [theme, setTheme] = useState(defaultTheme);
  const [darkMode, setDarkMode] = useState(false);

  // ✅ Cargar tema desde localStorage si existe
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
  }, []);

  // ✅ Aplicar cambios de color al documento
  const applyTheme = (t) => {
    const root = document.documentElement;
    root.style.setProperty("--color-brand", t.brand);
    root.style.setProperty("--color-accent", t.accent);
    root.style.setProperty("--color-bg", t.background);
    root.style.setProperty("--color-text", t.text);
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

  return (
    <div className="container-page space-y-12 pt-24 transition-colors duration-300">
      {/* 🔹 Top Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-border/50 z-20 h-16 flex items-center justify-between px-6 shadow-sm">
        <h1 className="font-semibold text-lg text-[var(--color-text)] flex items-center gap-2">
          🎨 Theme Editor
          <span className="text-sm text-gray-500 font-normal hidden sm:inline">
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

      {/* Header */}
      <header className="flex items-center justify-between pt-4">
        <div>
          <h2 className="heading text-2xl font-bold">
            Team Home Services Theme
          </h2>
          <p className="subheading text-gray-500">
            Adjust your brand colors and instantly preview the design system.
          </p>
        </div>
      </header>

      {/* Color Controls */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-[var(--color-brand)]">
          Theme Colors
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {Object.entries(theme).map(([key, value]) => (
            <div
              key={key}
              className="card flex flex-col items-center gap-3 p-4 border rounded-lg bg-white dark:bg-gray-800"
            >
              <label className="capitalize font-semibold">{key}</label>
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

      {/* Buttons Preview */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-[var(--color-brand)]">
          Buttons
        </h2>
        <div className="flex flex-wrap gap-4">
          <button
            className="px-4 py-2 rounded-md font-medium text-white"
            style={{ backgroundColor: theme.brand }}
          >
            Primary
          </button>
          <button
            className="px-4 py-2 rounded-md font-medium border"
            style={{ borderColor: theme.brand, color: theme.brand }}
          >
            Outline
          </button>
          <button
            className="px-4 py-2 rounded-md font-medium text-white"
            style={{ backgroundColor: theme.accent }}
          >
            Accent
          </button>
          <button className="px-4 py-2 rounded-md font-medium text-white bg-green-600">
            Success
          </button>
        </div>
      </section>

      {/* Badges Preview */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-[var(--color-brand)]">
          Status Badges
        </h2>
        <div className="flex gap-4 flex-wrap">
          <span
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{ backgroundColor: `${theme.brand}22`, color: theme.brand }}
          >
            Pending
          </span>
          <span
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: `${theme.accent}22`,
              color: theme.accent,
            }}
          >
            In Progress
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
            Completed
          </span>
        </div>
      </section>

      {/* Cards Preview */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-[var(--color-brand)]">
          Cards
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="card p-4 rounded-lg border hover:shadow transition bg-white dark:bg-gray-800"
              style={{ borderColor: theme.brand }}
            >
              <h3 className="font-semibold mb-2 text-[var(--color-text)]">
                Example Card {i}
              </h3>
              <p className="text-sm text-gray-500">
                This is a card preview using your current color theme.
              </p>
              <button
                className="mt-3 px-3 py-1 rounded-md text-sm font-medium"
                style={{
                  backgroundColor: theme.brand,
                  color: "#fff",
                }}
              >
                View
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Typography Preview */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-[var(--color-brand)]">
          Typography
        </h2>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-[var(--color-text)]">
            Heading 1
          </h1>
          <h2 className="text-3xl font-semibold text-[var(--color-text)]">
            Heading 2
          </h2>
          <p className="text-base" style={{ color: theme.text }}>
            This is a sample paragraph showing how your brand text color looks
            in combination with background and accent tones.
          </p>
        </div>
      </section>
    </div>
  );
}
