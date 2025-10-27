"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

export default function AppearanceSettings() {
  const [theme, setTheme] = useState("system");

  useEffect(() => {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("system");
    }
  }, []);

  const applyTheme = (value) => {
    setTheme(value);
    document.documentElement.classList.remove("dark");
    if (value === "dark") document.documentElement.classList.add("dark");
    if (value === "system") {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="container-page px-6 pb-8 space-y-8"
    >
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-gray-800">🎨 Appearance</h1>
        <p className="text-gray-500 text-sm">
          Choose how Team Home Services looks on your device.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <button
          onClick={() => applyTheme("light")}
          className={`border rounded-lg p-6 flex flex-col items-center gap-3 hover:bg-gray-50 transition ${
            theme === "light" ? "border-blue-500 bg-blue-50" : "border-gray-200"
          }`}
        >
          <Sun size={26} className="text-yellow-500" />
          <span className="font-medium text-gray-700">Light Mode</span>
        </button>

        <button
          onClick={() => applyTheme("dark")}
          className={`border rounded-lg p-6 flex flex-col items-center gap-3 hover:bg-gray-50 transition ${
            theme === "dark" ? "border-blue-500 bg-blue-50" : "border-gray-200"
          }`}
        >
          <Moon size={26} className="text-gray-700 dark:text-yellow-400" />
          <span className="font-medium text-gray-700">Dark Mode</span>
        </button>

        <button
          onClick={() => applyTheme("system")}
          className={`border rounded-lg p-6 flex flex-col items-center gap-3 hover:bg-gray-50 transition ${
            theme === "system"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200"
          }`}
        >
          <Monitor size={26} className="text-gray-700" />
          <span className="font-medium text-gray-700">System Default</span>
        </button>
      </div>
    </motion.div>
  );
}
