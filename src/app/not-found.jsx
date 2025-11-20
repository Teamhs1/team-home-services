"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 py-20">
      {/* Illustration Airbnb-style */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <img
          src="https://cdn-icons-png.flaticon.com/512/4076/4076504.png"
          alt="Not found illustration"
          className="w-48 h-48 opacity-90"
        />
      </motion.div>

      {/* Main Text */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-center max-w-lg"
      >
        <h1 className="text-4xl font-semibold text-gray-900 mb-3">Oops!</h1>

        <p className="text-gray-600 text-lg leading-relaxed">
          We can't seem to find the page you're looking for. It may have been
          moved, deleted, or never existed.
        </p>
      </motion.div>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex gap-4 mt-10"
      >
        <Link
          href="/"
          className="px-6 py-3 rounded-lg bg-primary text-white text-base font-medium shadow hover:bg-primary/90 transition"
        >
          Back to Home
        </Link>

        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </motion.div>
    </div>
  );
}
