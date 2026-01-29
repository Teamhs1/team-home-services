"use client";
import { useEffect, useRef } from "react";
import { useState } from "react";
import Image from "next/image";
import { useSwipeable } from "react-swipeable";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Image as ImageIcon,
} from "lucide-react";

/* =========================
   Helpers
========================= */
const cleanUrl = (url) =>
  url
    ?.replace(/\s/g, "%20")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/#/g, "%23");

/* =========================
   Fullscreen
========================= */

function Fullscreen({ images, index, setIndex, onClose }) {
  const overlayRef = useRef(null);

  // ESC + bloquear scroll
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) setIndex(index - 1);
      if (e.key === "ArrowRight" && index < images.length - 1)
        setIndex(index + 1);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [index, images.length, onClose, setIndex]);

  // Click fuera
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Image */}
      <div className="relative w-full h-full max-w-[92vw] max-h-[92vh]">
        <Image
          src={images[index]}
          alt="fullscreen"
          fill
          unoptimized
          className="object-contain select-none"
        />
      </div>

      {/* Prev */}
      {index > 0 && (
        <button
          onClick={() => setIndex(index - 1)}
          className="absolute left-4 rounded-full bg-black/60 p-3 text-white hover:bg-black/80"
        >
          <ChevronLeft className="h-7 w-7" />
        </button>
      )}

      {/* Next */}
      {index < images.length - 1 && (
        <button
          onClick={() => setIndex(index + 1)}
          className="absolute right-4 rounded-full bg-black/60 p-3 text-white hover:bg-black/80"
        >
          <ChevronRight className="h-7 w-7" />
        </button>
      )}
    </div>
  );
}

/* =========================
   UnitSlider
========================= */
export default function UnitSlider({ images = [], height = 480 }) {
  const cleaned = images
    .map((img) => {
      if (!img) return null;
      if (typeof img === "string") return cleanUrl(img);
      if (typeof img === "object" && img.url) return cleanUrl(img.url);
      return null;
    })
    .filter(Boolean);

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  const next = () => {
    if (index < cleaned.length - 1) {
      setDirection(1);
      setIndex((i) => i + 1);
    }
  };

  const prev = () => {
    if (index > 0) {
      setDirection(-1);
      setIndex((i) => i - 1);
    }
  };

  const handlers = useSwipeable({
    onSwipedLeft: next,
    onSwipedRight: prev,
    trackMouse: true,
  });

  if (!cleaned.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed text-muted-foreground">
        <ImageIcon className="h-6 w-6 mr-2" />
        No unit photos
      </div>
    );
  }

  return (
    <>
      <div
        {...handlers}
        className="relative overflow-hidden bg-black/5"
        style={{ height }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ x: direction === 1 ? 120 : -120, opacity: 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction === 1 ? -120 : 120, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Image
              src={cleaned[index]}
              alt={`unit-${index}`}
              fill
              unoptimized
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Counter */}
        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
          {index + 1} / {cleaned.length}
        </div>

        {/* Controls */}
        {index > 0 && (
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/70 p-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {index < cleaned.length - 1 && (
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/70 p-2"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        <button
          onClick={() => setFullscreen(true)}
          className="absolute right-3 top-3 rounded-full bg-white/70 p-2"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {fullscreen && (
        <Fullscreen
          images={cleaned}
          index={index}
          setIndex={setIndex}
          onClose={() => setFullscreen(false)}
        />
      )}
    </>
  );
}
