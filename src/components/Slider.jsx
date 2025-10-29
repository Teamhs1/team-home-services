"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useSwipeable } from "react-swipeable";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, ChevronLeft, ChevronRight } from "lucide-react";

export default function Slider({
  imageList = [],
  mini = false,
  disableFullscreen = false,
}) {
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const images = imageList || [];

  const next = () => {
    if (index < images.length - 1) setIndex((prev) => prev + 1);
  };

  const prev = () => {
    if (index > 0) setIndex((prev) => prev - 1);
  };

  // 🚫 Evita que el swipe se dispare dentro del comparador
  const handlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      const target = eventData.event.target;
      if (target.closest(".no-swipe")) return; // ignora el swipe si viene del comparador
      next();
    },
    onSwipedRight: (eventData) => {
      const target = eventData.event.target;
      if (target.closest(".no-swipe")) return;
      prev();
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  useEffect(() => {
    if (index >= images.length) setIndex(0);
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border bg-gray-50 text-sm text-gray-500">
        No photos uploaded yet
      </div>
    );
  }

  return (
    <>
      {/* 🖼️ Slider principal */}
      <div
        {...handlers}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`relative w-full overflow-hidden rounded-2xl ${
          mini ? "h-56" : "h-[500px]"
        } bg-black/5`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {/* ✅ Soporte robusto: imágenes o JSX */}
            {(() => {
              const current = images[index];
              const src =
                typeof current === "object" && current?.url
                  ? current.url
                  : typeof current === "string"
                  ? current
                  : null;

              if (src && typeof src === "string" && src.trim() !== "") {
                return (
                  <Image
                    src={src}
                    alt={`slide-${index}`}
                    fill
                    className="object-cover rounded-2xl"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={false}
                  />
                );
              }

              if (React.isValidElement(current)) {
                return (
                  <div className="w-full h-full flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-2xl overflow-hidden">
                    {current}
                  </div>
                );
              }

              return (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                  No valid content
                </div>
              );
            })()}
          </motion.div>
        </AnimatePresence>

        {/* ⬅ Flechas navegación */}
        {images.length > 1 && (
          <>
            {index > 0 && (
              <motion.button
                initial={{ opacity: 0, x: -15 }}
                animate={{
                  opacity: hovered ? 1 : 0,
                  x: hovered ? 0 : -15,
                }}
                transition={{ duration: 0.3 }}
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full backdrop-blur-sm bg-white/70 shadow-sm p-1.5 text-gray-700 hover:bg-white hover:shadow-md transition"
              >
                <ChevronLeft className="h-5 w-5" />
              </motion.button>
            )}
            {index < images.length - 1 && (
              <motion.button
                initial={{ opacity: 0, x: 15 }}
                animate={{
                  opacity: hovered ? 1 : 0,
                  x: hovered ? 0 : 15,
                }}
                transition={{ duration: 0.3 }}
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full backdrop-blur-sm bg-white/70 shadow-sm p-1.5 text-gray-700 hover:bg-white hover:shadow-md transition"
              >
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            )}
          </>
        )}

        {/* 🔢 Contador */}
        <div className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
          {index + 1} / {images.length}
        </div>

        {/* ⛶ Botón fullscreen */}
        {!disableFullscreen && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{
              opacity: hovered ? 1 : 0,
              y: hovered ? 0 : -10,
            }}
            transition={{
              duration: 0.35,
              delay: hovered ? 0.25 : 0,
            }}
            onClick={() => setIsFullscreen(true)}
            className="absolute right-2 top-2 rounded-full backdrop-blur-sm bg-white/60 shadow-sm p-1.5 text-gray-600 hover:bg-white/80 hover:text-gray-800 transition"
          >
            <Maximize2 className="h-4 w-4" />
          </motion.button>
        )}

        {/* 🔘 Indicadores */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {images.map((_, i) => (
              <div
                key={i}
                onClick={() => setIndex(i)}
                className={`h-2 w-2 cursor-pointer rounded-full transition ${
                  i === index ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 🪟 Pantalla completa */}
      {isFullscreen && (
        <div
          onClick={() => setIsFullscreen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
        >
          <div className="relative w-[90vw] h-[80vh]">
            {(() => {
              const current = images[index];
              const src =
                typeof current === "object" && current?.url
                  ? current.url
                  : typeof current === "string"
                  ? current
                  : null;

              if (src && typeof src === "string" && src.trim() !== "") {
                return (
                  <Image
                    src={src}
                    alt={`fullscreen-${index}`}
                    fill
                    className="object-contain"
                    sizes="100vw"
                  />
                );
              }

              if (React.isValidElement(current)) return current;

              return (
                <div className="flex items-center justify-center h-full text-white/70 text-sm">
                  No valid content
                </div>
              );
            })()}
            {images.length > 1 && (
              <>
                {index > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prev();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/40"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}
                {index < images.length - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      next();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/40"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}
              </>
            )}
            <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
              {index + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
