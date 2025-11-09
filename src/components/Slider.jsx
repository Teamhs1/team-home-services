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

// 🧩 Nuevo import del visor fullscreen
import FullscreenViewer from "./FullscreenViewer";

// ✅ Helper: genera URLs limpias del bucket público
const getImageUrl = (src) => {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) {
    return src
      .replace(/\s/g, "%20")
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29")
      .replace(/#/g, "%23");
  }
  const cleanPath = src
    .replace(/^\/?storage\/v1\/object\/public\/job-photos\//, "")
    .replace(/^job-photos\//, "")
    .trim();
  const encodedPath = cleanPath
    .split("/")
    .map((segment) =>
      encodeURIComponent(segment)
        .replace(/\(/g, "%28")
        .replace(/\)/g, "%29")
        .replace(/#/g, "%23")
    )
    .join("/");
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/job-photos/${encodedPath}`;
};

// 🎨 Shimmer loader
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

export default function Slider({
  jobId,
  mini = false,
  disableFullscreen = false,
}) {
  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const sliderRef = useRef(null);

  // 🔹 Cargar fotos
  useEffect(() => {
    if (!jobId) return;
    const fetchPhotos = async () => {
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
        console.error("❌ Error fetching photos:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();
  }, [jobId]);

  // 🔁 Navegación
  const next = (e) => {
    e?.stopPropagation();
    if (index < images.length - 1) setIndex((i) => i + 1);
  };
  const prev = (e) => {
    e?.stopPropagation();
    if (index > 0) setIndex((i) => i - 1);
  };

  const handlers = useSwipeable({
    onSwipedLeft: next,
    onSwipedRight: prev,
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  // ⌨️ Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e) => e.key === "Escape" && setIsFullscreen(false);
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 🧩 Evita clics accidentales
  useEffect(() => {
    if (sliderRef.current) {
      sliderRef.current.style.pointerEvents = isFullscreen ? "none" : "auto";
    }
  }, [isFullscreen]);

  // ⏳ Estado de carga
  if (loading)
    return (
      <div className="flex h-48 items-center justify-center text-gray-400 text-sm italic">
        <Loader2 className="animate-spin w-4 h-4 mr-2" /> Cargando fotos...
      </div>
    );

  if (images.length === 0)
    return (
      <div className="relative flex flex-col items-center justify-center h-48 rounded-xl border border-dashed border-gray-300 bg-gradient-to-b from-gray-50 to-gray-100 text-gray-500 overflow-hidden">
        <ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
        <p className="text-sm font-medium">No photos uploaded yet</p>
      </div>
    );

  return (
    <>
      {/* SLIDER PRINCIPAL */}
      <div
        ref={sliderRef}
        {...handlers}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={(e) => {
          if (isFullscreen) {
            e.stopPropagation();
            e.preventDefault();
            return;
          }
          router.push(`/jobs/${jobId}`);
        }}
        className={`relative w-full overflow-hidden rounded-2xl ${
          mini ? "h-56" : "h-[500px]"
        } bg-black/5 cursor-pointer`}
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
            <Image
              key={images[index]}
              src={getImageUrl(images[index])}
              alt={`slide-${index}`}
              fill
              unoptimized
              className="object-cover rounded-2xl transition-transform duration-300 hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 50vw"
              placeholder="blur"
              blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer)}`}
            />
          </motion.div>
        </AnimatePresence>

        {/* CONTADOR */}
        <div className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-1 text-xs text-white select-none">
          {index + 1} / {images.length}
        </div>

        {/* FLECHAS */}
        {images.length > 1 && (
          <>
            {index > 0 && (
              <motion.button
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : -15 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/70 backdrop-blur-sm p-1.5 shadow-sm text-gray-700 hover:bg-white hover:shadow-md transition"
              >
                <ChevronLeft className="h-5 w-5" />
              </motion.button>
            )}
            {index < images.length - 1 && (
              <motion.button
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : 15 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/70 backdrop-blur-sm p-1.5 shadow-sm text-gray-700 hover:bg-white hover:shadow-md transition"
              >
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            )}
          </>
        )}

        {/* FULLSCREEN BUTTON */}
        {!disableFullscreen && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{
              opacity: hovered ? 1 : 0,
              y: hovered ? 0 : -10,
            }}
            transition={{ duration: 0.35 }}
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(true);
            }}
            className="absolute right-2 top-2 rounded-full bg-white/60 backdrop-blur-sm shadow-sm p-1.5 text-gray-600 hover:bg-white/80 hover:text-gray-800 transition"
          >
            <Maximize2 className="h-4 w-4" />
          </motion.button>
        )}
      </div>

      {/* 🧩 Nuevo componente modular FullscreenViewer */}
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
