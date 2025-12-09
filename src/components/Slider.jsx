"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useSwipeable } from "react-swipeable";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";

import FullscreenViewer from "./FullscreenViewer";

// =============================================
//  Helper: limpieza en URLs del bucket
// =============================================
const getImageUrl = (src) => {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) {
    return src
      .replace(/\s/g, "%20")
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29")
      .replace(/#/g, "%23");
  }

  const clean = src
    .replace(/^\/?storage\/v1\/object\/public\/job-photos\//, "")
    .replace(/^job-photos\//, "")
    .trim();

  const encoded = clean
    .split("/")
    .map((segment) =>
      encodeURIComponent(segment)
        .replace(/\(/g, "%28")
        .replace(/\)/g, "%29")
        .replace(/#/g, "%23")
    )
    .join("/");

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/job-photos/${encoded}`;
};

// =============================================
//  Shimmer
// =============================================
const shimmer = `
  <svg width="700" height="475" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g">
        <stop stop-color="#dbeafe" offset="20%" />
        <stop stop-color="#f3f4f6" offset="50%" />
        <stop stop-color="#bfdbfe" offset="70%" />
      </linearGradient>
    </defs>
    <rect width="700" height="475" fill="#e5e7eb" />
    <rect id="r" width="700" height="475" fill="url(#g)" />
    <animate xlink:href="#r" attributeName="x" from="-700" to="700" dur="1.2s" repeatCount="indefinite" />
  </svg>`;
const toBase64 = (str) =>
  typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);

// =============================================
//  Slider Component
// =============================================
export default function Slider({
  jobId,
  mini = false,
  disableFullscreen = false,
}) {
  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const sliderRef = useRef(null);

  // Cargar fotos
  useEffect(() => {
    if (!jobId) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/job-photos/list?job_id=${jobId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error loading photos");

        const all = [
          ...(data.data?.before || []),
          ...(data.data?.after || []),
          ...(data.data?.general || []),
        ];

        setImages(all.map((p) => getImageUrl(p.image_url)).filter(Boolean));
      } catch (err) {
        console.error("❌ Error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [jobId]);

  const safeStop = (e) => e?.stopPropagation?.();

  const next = (e) => {
    safeStop(e);
    if (index < images.length - 1) {
      setDirection(1);
      setIndex((i) => i + 1);
    }
  };

  const prev = (e) => {
    safeStop(e);
    if (index > 0) {
      setDirection(-1);
      setIndex((i) => i - 1);
    }
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => next(),
    onSwipedRight: () => prev(),
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  // Escape para fullscreen
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && setIsFullscreen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  if (loading)
    return (
      <div className="flex h-48 items-center justify-center text-gray-400 text-sm italic">
        <Loader2 className="animate-spin w-4 h-4 mr-2" /> Cargando fotos...
      </div>
    );

  if (images.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-48 rounded-xl border border-dashed border-gray-300 bg-gradient-to-b from-gray-50 to-gray-100 text-gray-500">
        <ImageIcon className="w-8 h-8 mb-2" />
        <p className="text-sm font-medium">No photos uploaded yet</p>
      </div>
    );

  return (
    <>
      <div
        ref={sliderRef}
        {...handlers}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => !isFullscreen && router.push(`/jobs/${jobId}`)}
        className={`relative w-full overflow-hidden rounded-t-xl ${
          mini ? "h-56" : "h-[500px]"
        } bg-black/5 cursor-pointer`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ x: direction === 1 ? 120 : -120, opacity: 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction === 1 ? -120 : 120, opacity: 1 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute inset-0"
          >
            <Image
              key={images[index]}
              src={images[index]}
              alt={`slide-${index}`}
              fill
              unoptimized
              className="object-contain rounded-t-xl bg-black"
              sizes="(max-width: 768px) 100vw, 50vw"
              placeholder="blur"
              blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer)}`}
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute left-2 top-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
          {index + 1} / {images.length}
        </div>

        {/* Flechas */}
        {images.length > 1 && (
          <>
            {index > 0 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: hovered ? 1 : 0 }}
                transition={{ duration: 0.25 }}
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/70 p-1.5 rounded-full shadow backdrop-blur"
              >
                <ChevronLeft className="h-5 w-5" />
              </motion.button>
            )}

            {index < images.length - 1 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: hovered ? 1 : 0 }}
                transition={{ duration: 0.25 }}
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/70 p-1.5 rounded-full shadow backdrop-blur"
              >
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            )}
          </>
        )}

        {!disableFullscreen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => {
              safeStop(e);
              setIsFullscreen(true);
            }}
            className="absolute right-2 top-2 bg-white/60 p-1.5 rounded-full shadow backdrop-blur"
          >
            <Maximize2 className="h-4 w-4 text-gray-700" />
          </motion.button>
        )}
      </div>

      {isFullscreen && (
        <FullscreenViewer
          images={images}
          index={index}
          setIndex={setIndex}
          onClose={() => setIsFullscreen(false)}
        />
      )}
    </>
  );
}
