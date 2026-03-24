"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let lastScrollY = 0;

    const handleScroll = () => {
      const scrollY =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;

      // 👇 Solo cambia cuando realmente es necesario
      if (scrollY > 80 && !visible) {
        setVisible(true);
      }

      if (scrollY <= 20 && visible) {
        setVisible(false);
      }

      lastScrollY = scrollY;
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [visible]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed right-6 z-50 p-3 rounded-full shadow-xl backdrop-blur-md
        bg-black/80 hover:bg-black text-white
        transition-all duration-300 ease-out
        ${
          visible
            ? "bottom-24 opacity-100 scale-100"
            : "bottom-16 opacity-0 scale-90 pointer-events-none"
        }
      `}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
