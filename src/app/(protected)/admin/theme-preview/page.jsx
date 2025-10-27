"use client";

import { useState } from "react";

export default function ThemePreviewPage() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="container-page space-y-12">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="heading">🎨 Team Home Services Theme</h1>
          <p className="subheading">
            Visual preview of your brand colors, buttons, badges, and typography
          </p>
        </div>
        <button onClick={toggleTheme} className="btn-brand-outline">
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </header>

      {/* Brand Colors */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-brand">Brand Colors</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-brand"></div>
            <span className="text-sm text-gray-500">Primary</span>
          </div>
          <div className="card flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-brand-soft"></div>
            <span className="text-sm text-gray-500">Primary Soft</span>
          </div>
          <div className="card flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-500">Accent</span>
          </div>
          <div className="card flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            <span className="text-sm text-gray-500">Neutral</span>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-brand">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <button className="btn-brand">Primary Button</button>
          <button className="btn-brand-outline">Outline Button</button>
          <button className="btn-brand bg-green-600 hover:bg-green-700">
            Success
          </button>
          <button className="btn-brand bg-red-600 hover:bg-red-700">
            Danger
          </button>
        </div>
      </section>

      {/* Badges */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-brand">Status Badges</h2>
        <div className="flex gap-4">
          <span className="badge badge-pending">Pending</span>
          <span className="badge badge-progress">In Progress</span>
          <span className="badge badge-complete">Completed</span>
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-brand">Cards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card card-hover">
            <h3 className="font-semibold mb-2">Cleaning Job</h3>
            <p className="text-sm text-gray-500">
              Standard apartment cleaning with deep bathroom and kitchen.
            </p>
            <div className="mt-4 flex justify-between items-center">
              <span className="badge badge-progress">In Progress</span>
              <button className="btn-brand-outline text-sm py-1 px-3">
                View
              </button>
            </div>
          </div>

          <div className="card card-hover">
            <h3 className="font-semibold mb-2">Maintenance</h3>
            <p className="text-sm text-gray-500">
              Fixing minor wall cracks and repainting interior surfaces.
            </p>
            <div className="mt-4 flex justify-between items-center">
              <span className="badge badge-pending">Pending</span>
              <button className="btn-brand-outline text-sm py-1 px-3">
                Start
              </button>
            </div>
          </div>

          <div className="card card-hover">
            <h3 className="font-semibold mb-2">Inspection</h3>
            <p className="text-sm text-gray-500">
              Full property inspection for turnover before next tenant.
            </p>
            <div className="mt-4 flex justify-between items-center">
              <span className="badge badge-complete">Completed</span>
              <button className="btn-brand-outline text-sm py-1 px-3">
                Details
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-brand">Typography</h2>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Heading 1</h1>
          <h2 className="text-3xl font-semibold">Heading 2</h2>
          <h3 className="text-2xl font-semibold">Heading 3</h3>
          <p className="text-base text-gray-600 dark:text-gray-300">
            This is a sample paragraph showing how body text looks in your
            theme. The tone is neutral, easy to read, and fits both light and
            dark modes.
          </p>
        </div>
      </section>
    </div>
  );
}
