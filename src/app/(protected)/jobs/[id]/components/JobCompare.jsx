"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";

const ReactCompareImage = dynamic(() => import("react-compare-image"), {
  ssr: false,
});

export default function JobCompare({ beforePhotos, afterPhotos, publicUrl }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (beforePhotos.length === 0 || afterPhotos.length === 0)
    return (
      <p className="text-gray-500 italic text-sm text-center">
        No paired before/after comparisons yet.
      </p>
    );

  const normalize = (v) => (v || "unknown").trim().toLowerCase();

  const pairs = beforePhotos
    .map((before, i) => {
      const cat = normalize(before.category);
      const after =
        afterPhotos.find((a) => normalize(a.category) === cat) ||
        afterPhotos[i];
      return after ? { before, after, key: cat } : null;
    })
    .filter(Boolean);

  const total = pairs.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden bg-white shadow-lg p-6"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={pairs[currentIndex].key}
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -80 }}
          className="w-full"
        >
          <div className="text-center text-sm font-medium bg-gray-900 text-white py-1.5 rounded-md mb-4 uppercase tracking-wide shadow-sm">
            {pairs[currentIndex].key.replace("_", " ")}
          </div>

          <ReactCompareImage
            leftImage={publicUrl(pairs[currentIndex].before.image_url)}
            rightImage={publicUrl(pairs[currentIndex].after.image_url)}
          />
        </motion.div>
      </AnimatePresence>

      {/* NAV BUTTONS */}
      <button
        onClick={() => setCurrentIndex((prev) => (prev - 1 + total) % total)}
        className="absolute left-5 top-1/2 -translate-y-1/2 bg-white/70 p-3 rounded-full"
      >
        <ArrowLeft className="w-6 h-6 text-gray-700" />
      </button>

      <button
        onClick={() => setCurrentIndex((prev) => (prev + 1) % total)}
        className="absolute right-5 top-1/2 -translate-y-1/2 bg-white/70 p-3 rounded-full"
      >
        <ArrowLeft className="rotate-180 w-6 h-6 text-gray-700" />
      </button>
    </motion.div>
  );
}
