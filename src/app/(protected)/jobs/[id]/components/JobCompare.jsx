"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FullscreenViewer from "@/components/FullscreenViewer";
import { ArrowLeft, Maximize2 } from "lucide-react";

export default function JobCompare({ beforePhotos, afterPhotos, publicUrl }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // FULLSCREEN STATE
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenImages, setFullscreenImages] = useState([]);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);

  const [showHint, setShowHint] = useState(true);
  const [position, setPosition] = useState(0.5);

  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    setShowHint(true);

    const timer = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // 🔥 RESET SLIDER POSITION CUANDO CAMBIA LA COMPARACIÓN
  useEffect(() => {
    setPosition(0.5);
  }, [currentIndex]);

  if (!beforePhotos?.length || !afterPhotos?.length) {
    return (
      <p className="text-gray-500 italic text-sm text-center">
        No paired before/after comparisons yet.
      </p>
    );
  }

  const normalize = (v) => (v || "unknown").trim().toLowerCase();

  // 🔥 AGRUPAR POR CATEGORÍA Y EMPAREJAR POR ÍNDICE
  const groupedBefore = {};
  const groupedAfter = {};

  // Agrupar BEFORE
  beforePhotos.forEach((photo) => {
    const category = normalize(photo.category);
    if (!groupedBefore[category]) groupedBefore[category] = [];
    groupedBefore[category].push(photo);
  });

  // Agrupar AFTER
  afterPhotos.forEach((photo) => {
    const category = normalize(photo.category);
    if (!groupedAfter[category]) groupedAfter[category] = [];
    groupedAfter[category].push(photo);
  });

  // Crear pares por categoría e índice
  const pairs = [];

  Object.keys(groupedBefore).forEach((category) => {
    if (!groupedAfter[category]) return;

    const beforeList = groupedBefore[category];
    const afterList = groupedAfter[category];

    const minLength = Math.min(beforeList.length, afterList.length);

    for (let i = 0; i < minLength; i++) {
      pairs.push({
        before: beforeList[i],
        after: afterList[i],
        key: `${category}-${i}`, // clave única
        label: category,
      });
    }
  });

  if (!pairs.length) {
    return (
      <p className="text-gray-500 italic text-sm text-center">
        No valid before/after comparisons available.
      </p>
    );
  }

  const total = pairs.length;
  const current = pairs[currentIndex];

  const openFullscreen = () => {
    setFullscreenImages([
      publicUrl(current.before.image_url),
      publicUrl(current.after.image_url),
    ]);
    setFullscreenIndex(0);
    setIsFullscreen(true);
  };

  const updatePosition = (clientX) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const newPosition = (clientX - rect.left) / rect.width;
    setPosition(Math.min(Math.max(newPosition, 0), 1));
  };

  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const width = containerRef.current?.offsetWidth || 0;
  const lineX = width * position;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-3xl mx-auto rounded-xl overflow-hidden bg-white shadow-lg p-4"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            className="relative w-full"
          >
            {/* CATEGORY */}
            <div className="text-center text-sm font-medium bg-gray-900 text-white py-1 rounded-md mb-4 uppercase tracking-wide shadow-sm">
              {current.label.replaceAll("_", " ")}
            </div>

            {/* COMPARE */}
            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="relative w-full rounded-lg overflow-hidden
              h-[300px] sm:h-[380px] md:h-[460px] lg:h-[520px]
              select-none cursor-col-resize"
            >
              {/* BEFORE IMAGE */}
              <img
                src={publicUrl(current.before.image_url)}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />

              {/* AFTER IMAGE */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  clipPath: `inset(0 ${width - lineX}px 0 0)`,
                }}
              >
                <img
                  src={publicUrl(current.after.image_url)}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>

              {/* LINE */}
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-white shadow-lg"
                style={{
                  left: `${lineX}px`,
                }}
              />

              {/* HANDLE */}
              <div
                className="absolute top-1/2 -translate-y-1/2
                w-8 h-8 rounded-full bg-white shadow-lg
                flex items-center justify-center pointer-events-none"
                style={{
                  left: `${lineX - 16}px`,
                }}
              >
                <ArrowLeft className="w-4 h-4 text-gray-700" />
              </div>

              {/* LABELS */}
              <span className="absolute top-3 left-3 z-20 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Before
              </span>

              <span className="absolute top-3 right-14 z-20 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold">
                After
              </span>

              {/* EXPAND */}
              <button
                onClick={openFullscreen}
                className="absolute top-3 right-3 z-30 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full shadow transition"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* HINT */}
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2
                  bg-black/70 text-white text-xs px-4 py-2
                  rounded-full z-30 pointer-events-none"
                >
                  Drag to compare
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* NAVIGATION */}
        <button
          onClick={() => setCurrentIndex((prev) => (prev - 1 + total) % total)}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-3 rounded-full shadow-md hover:bg-white transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % total)}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-3 rounded-full shadow-md hover:bg-white transition"
        >
          <ArrowLeft className="rotate-180 w-5 h-5 text-gray-700" />
        </button>
      </motion.div>

      {isFullscreen && (
        <FullscreenViewer
          images={fullscreenImages}
          index={fullscreenIndex}
          setIndex={setFullscreenIndex}
          onClose={() => setIsFullscreen(false)}
        />
      )}
    </>
  );
}
