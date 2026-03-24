"use client";

import { useEffect, useState } from "react";

export default function WhatsAppButton() {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 1200);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <a
      href="https://wa.me/15065888517?text=Hi%20I%20need%20a%20cleaning%20quote%20in%20Moncton"
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-20 right-6 z-50 flex items-center gap-3
    bg-gradient-to-r from-green-500 to-green-600
    text-white px-5 py-3 rounded-full
    shadow-lg hover:shadow-xl
    backdrop-blur-md
    transition-all duration-300 ease-out
    hover:scale-105 active:scale-95
    ${pulse ? "ring-4 ring-green-400/30" : ""}
  `}
    >
      {/* Icono más limpio */}
      <span className="flex items-center justify-center w-5 h-5">💬</span>

      {/* Texto */}
      <span className="font-medium tracking-tight">Get a Quote</span>
    </a>
  );
}
