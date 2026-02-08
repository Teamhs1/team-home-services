"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import FullscreenGallery from "./FullscreenGallery";

export default function MiniImageSlider({ images = [] }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const startX = useRef(null);

  if (!images.length) return null;

  const prev = () => setIndex((i) => Math.max(i - 1, 0));
  const next = () => setIndex((i) => Math.min(i + 1, images.length - 1));

  /* Swipe */
  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (!startX.current) return;
    const delta = startX.current - e.changedTouches[0].clientX;

    if (delta > 50) next();
    if (delta < -50) prev();

    startX.current = null;
  };

  return (
    <>
      <div
        className="group relative h-full w-full overflow-hidden rounded-xl"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={(e) => {
          // 🔒 evita navegación si el card es un <Link>
          e.preventDefault();
          setOpen(true);
        }}
      >
        {/* SLIDER */}
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="h-full w-full shrink-0 object-cover"
              loading="lazy"
            />
          ))}
        </div>

        {/* Dots */}
        <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
          {images.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition ${
                i === index ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>

        {/* Controls */}
        {index > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prev();
            }}
            className="
              absolute left-2 top-1/2 -translate-y-1/2
              rounded-full bg-white/90 p-1 shadow
              opacity-0 transition group-hover:opacity-100
            "
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {index < images.length - 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              next();
            }}
            className="
              absolute right-2 top-1/2 -translate-y-1/2
              rounded-full bg-white/90 p-1 shadow
              opacity-0 transition group-hover:opacity-100
            "
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* FULLSCREEN */}
      {open && (
        <FullscreenGallery
          images={images}
          startIndex={index}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
