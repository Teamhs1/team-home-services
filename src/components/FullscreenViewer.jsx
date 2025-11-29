"use client";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function FullscreenViewer({ images, index, onClose, setIndex }) {
  const [isMobile, setIsMobile] = useState(false);

  // Detectar mobile para ocultar “Press ESC to exit”
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768); // mobile < 768px
    }
  }, []);

  if (!images?.length) return null;

  // ESC / flechas
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

  // Cerrar tocando fondo
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <AnimatePresence>
      {index !== null && (
        <motion.div
          key="fullscreen-viewer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="
            fixed inset-0 z-[9999]
            bg-black/90 backdrop-blur-sm
            flex items-center justify-center
            p-4
          "
          onClick={handleOverlayClick}
        >
          {/* ❌ X siempre visible (MEJORADA PARA CELULAR) */}
          <button
            onClick={onClose}
            className="
              absolute top-4 right-4
              bg-black/80 hover:bg-black/90
              text-white 
              p-3 sm:p-2 
              rounded-full
              z-[20000]
            "
            style={{
              // evita notch en iPhone o barra de Android
              marginTop: isMobile ? "1rem" : "0",
            }}
          >
            <X className="h-7 w-7 sm:h-6 sm:w-6" />
          </button>

          {/* 💬 Mensaje ESC SOLO EN DESKTOP */}
          {!isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.9, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="
                absolute top-3 left-1/2 -translate-x-1/2
                text-xs text-gray-300
                bg-black/30 backdrop-blur px-4 py-1
                rounded-full 
                pointer-events-none
              "
            >
              Press <span className="font-semibold">ESC</span> to exit
            </motion.div>
          )}

          {/* 📸 Imagen centrada — AGRANDADA */}
          <div
            className="
    relative 
    w-[100vw] max-w-[900px]
    h-[88vh] max-h-[900px]
    flex items-center justify-center
    rounded-lg
  "
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[index]}
              alt="fullscreen"
              fill
              priority
              className="object-contain rounded-lg"
            />
          </div>

          {/* ⬅ Flecha izquierda */}
          {index > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIndex((i) => i - 1);
              }}
              className="
                absolute left-4 top-1/2 -translate-y-1/2
                bg-white/20 hover:bg-white/40
                p-3 rounded-full text-white
                z-[20000]
              "
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
          )}

          {/* ➡ Flecha derecha */}
          {index < images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIndex((i) => i + 1);
              }}
              className="
                absolute right-4 top-1/2 -translate-y-1/2
                bg-white/20 hover:bg-white/40
                p-3 rounded-full text-white
                z-[20000]
              "
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          )}

          {/* Contador */}
          <div
            className="
              absolute left-4 top-4
              bg-black/60 px-3 py-1 rounded-full
              text-white text-sm
              z-[20000]
            "
          >
            {index + 1} / {images.length}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
