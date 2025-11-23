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
      className="relative w-full max-w-3xl mx-auto rounded-xl overflow-hidden bg-white shadow-lg p-4"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={pairs[currentIndex].key}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          className="relative w-full"
        >
          {/* Título categoría */}
          <div className="text-center text-sm font-medium bg-gray-900 text-white py-1 rounded-md mb-4 uppercase tracking-wide shadow-sm">
            {pairs[currentIndex].key.replace("_", " ")}
          </div>

          {/* Contenedor del comparador */}
          <div
            className="relative w-full rounded-lg overflow-hidden"
            style={{
              height: "360px", // altura equilibrada
            }}
          >
            {/* BEFORE */}
            <span className="absolute top-3 left-3 z-20 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Before
            </span>

            {/* AFTER */}
            <span className="absolute top-3 right-3 z-20 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold">
              After
            </span>

            {/* COMPARADOR */}
            <ReactCompareImage
              leftImage={publicUrl(pairs[currentIndex].before.image_url)}
              rightImage={publicUrl(pairs[currentIndex].after.image_url)}
              sliderLineWidth={2}
              handleSize={40} // tamaño círculo
              handleBackgroundColor="#ffffff" // círculo visible
              handleColor="#333" // flechas
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* BOTÓN IZQUIERDA */}
      <button
        onClick={() => setCurrentIndex((prev) => (prev - 1 + total) % total)}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-3 rounded-full shadow-md hover:bg-white transition"
      >
        <ArrowLeft className="w-5 h-5 text-gray-700" />
      </button>

      {/* BOTÓN DERECHA */}
      <button
        onClick={() => setCurrentIndex((prev) => (prev + 1) % total)}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-3 rounded-full shadow-md hover:bg-white transition"
      >
        <ArrowLeft className="rotate-180 w-5 h-5 text-gray-700" />
      </button>
    </motion.div>
  );
}
