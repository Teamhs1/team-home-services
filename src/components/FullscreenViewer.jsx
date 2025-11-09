"use client";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";

export default function FullscreenViewer({ images, index, onClose, setIndex }) {
  if (!images?.length) return null;

  // ⌨️ Teclas: Escape, ←, →
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight")
        setIndex((i) => Math.min(i + 1, images.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, setIndex, images.length]);

  // ✅ Evita clics que "pasen" al contenido detrás
  const handleOverlayClick = (e) => {
    e.stopPropagation(); // evita que burbujee
    e.preventDefault(); // bloquea comportamiento por defecto
    if (e.target === e.currentTarget) {
      // solo si se clickea directamente el fondo oscuro
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {index !== null && (
        <motion.div
          key="fullscreen-viewer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-default"
          onClick={handleOverlayClick}
        >
          {/* 💡 Texto UI/UX */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1 left-1/2 -translate-x-1/2 text-[11px] sm:text-sm text-gray-400 bg-black/30 backdrop-blur-md px-4 py-1 rounded-full pointer-events-none select-none"
          >
            Press <span className="font-semibold text-gray-200">Esc</span> to
            exit
          </motion.div>

          {/* Imagen centrada */}
          <div
            className="relative w-[85vw] h-[75vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()} // evita cerrar al clicar dentro
          >
            <Image
              src={images[index]}
              alt={`fullscreen-${index}`}
              fill
              priority
              className="object-contain select-none rounded-lg cursor-default"
              sizes="100vw"
            />
          </div>

          {/* Flechas */}
          {images.length > 1 && (
            <>
              {index > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex((i) => i - 1);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}
              {index < images.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex((i) => i + 1);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
            </>
          )}

          {/* Contador */}
          <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-sm text-white select-none">
            {index + 1} / {images.length}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
