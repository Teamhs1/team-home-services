"use client";

import { useEffect, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function FullscreenGallery({ images, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const startX = useRef(null);

  const prev = () => setIndex((i) => Math.max(i - 1, 0));
  const next = () => setIndex((i) => Math.min(i + 1, images.length - 1));

  /* ESC to close */
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* Swipe */
  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (!startX.current) return;
    const delta = startX.current - e.changedTouches[0].clientX;

    if (delta > 60) next();
    if (delta < -60) prev();

    startX.current = null;
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95" onClick={onClose}>
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-black/70 p-2 text-white"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Slider */}
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="flex h-full w-full shrink-0 items-center justify-center"
          >
            <img
              src={src}
              alt=""
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
          </div>
        ))}
      </div>

      {/* Controls */}
      {index > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white"
        >
          <ChevronLeft />
        </button>
      )}

      {index < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white"
        >
          <ChevronRight />
        </button>
      )}
    </div>
  );
}
