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
      className={`fixed bottom-6 right-6 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-2xl z-50 transition-all duration-300 hover:scale-110
      ${pulse ? "scale-110 shadow-green-400/50" : "scale-100"}`}
    >
      <span className="relative flex h-3 w-3">
        <span
          className={`absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75 ${
            pulse ? "animate-ping" : ""
          }`}
        ></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400"></span>
      </span>
      💬 Get a Quote
    </a>
  );
}
