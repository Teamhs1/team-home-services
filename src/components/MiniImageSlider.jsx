"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

export default function MiniImageSlider({ images = [] }) {
  const [index, setIndex] = useState(0);

  if (!images.length) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
        <ImageIcon className="h-6 w-6" />
      </div>
    );
  }

  const prev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => Math.max(i - 1, 0));
  };

  const next = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => Math.min(i + 1, images.length - 1));
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      <img
        src={images[index]}
        alt="rental"
        className="h-full w-full object-cover object-center transition-all duration-300"
        loading="lazy"
      />

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
          {index + 1}/{images.length}
        </div>
      )}

      {/* Controls */}
      {index > 0 && (
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1 shadow"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {index < images.length - 1 && (
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1 shadow"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
