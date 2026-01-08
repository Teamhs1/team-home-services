"use client";

import React from "react";

const Arrow = ({ direction, onClick, mini = false, total = 1 }) => {
  if (total <= 1) return null; // Oculta flechas si solo hay una imagen

  const size = mini ? "w-6 h-6 p-1.5" : "w-10 h-10 p-2.5";
  const icon = mini ? "w-3.5 h-3.5" : "w-6 h-6";
  const position = direction === "left" ? "left-2" : "right-2";

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`slider-arrow pointer-events-auto absolute top-1/2 z-50 ${size} ${position} flex -translate-y-1/2 scale-95 transform items-center justify-center rounded-full bg-white/90 opacity-0 shadow-md transition-all duration-300 ease-out hover:scale-110 group-hover:scale-100 group-hover:opacity-100`}
    >
      <svg
        className={`${icon} text-gray-500`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={direction === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
        />
      </svg>
    </button>
  );
};

export default Arrow;
