"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import { Loader2, ArrowLeft, CalendarDays, ClipboardList } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";

const ReactCompareImage = dynamic(() => import("react-compare-image"), {
  ssr: false,
});

export default function JobPhotosPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUser();

  const [photos, setPhotos] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedImage, setExpandedImage] = useState(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const [currentIndex, setCurrentIndex] = useState(0);
  // 🔹 Cargar trabajo y fotos (usa el mismo endpoint del admin)
  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setLoading(true);
        const supabase = createClient(supabaseUrl, supabaseAnon);

        // 1️⃣ Obtener datos del trabajo
        const { data: jobData } = await supabase
          .from("cleaning_jobs")
          .select("id, title, service_type, scheduled_date, status")
          .eq("id", id)
          .maybeSingle();

        setJob(jobData || null);

        // 2️⃣ Obtener fotos desde la API sin RLS (Service Role)
        const res = await fetch(`/api/job-photos/list?job_id=${id}`);
        const result = await res.json();

        if (!res.ok) throw new Error(result.error || "Failed to fetch photos");

        const grouped = result.data || { before: [], after: [], general: [] };

        // 3️⃣ Normaliza el tipo según la ruta o categoría
        const detectType = (p) => {
          const url = p.image_url?.toLowerCase() || "";
          if (url.includes("/before/") || p.category === "before")
            return "before";
          if (url.includes("/after/") || p.category === "after") return "after";
          return "general";
        };

        const allPhotos = [
          ...grouped.before.map((p) => ({ ...p, type: detectType(p) })),
          ...grouped.after.map((p) => ({ ...p, type: detectType(p) })),
          ...grouped.general.map((p) => ({ ...p, type: detectType(p) })),
        ];

        console.log(
          "🖼️ Fotos cargadas vía /api/job-photos/list:",
          allPhotos.length
        );
        console.table(
          allPhotos.map((p) => ({
            id: p.id,
            category: p.category,
            type: p.type,
            image_url: p.image_url,
          }))
        );
        setPhotos(allPhotos);
      } catch (err) {
        console.error("❌ Error fetching job/photos:", err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // 🔹 Escape para cerrar fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setExpandedImage(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 🔹 Categorías de fotos con fallback
  const beforePhotos = photos.filter(
    (p) => p.type === "before" || p.category?.toLowerCase() === "before"
  );
  const afterPhotos = photos.filter(
    (p) => p.type === "after" || p.category?.toLowerCase() === "after"
  );
  const generalPhotos = photos.filter(
    (p) =>
      p.type === "general" ||
      (!p.type && !["before", "after"].includes(p.category?.toLowerCase()))
  );

  // ✅ URLs públicas seguras (sin duplicar el dominio)
  const publicUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;

    const cleanPath = path.replace(/^\/?job-photos\//, "").trim();
    const encodedPath = cleanPath
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");

    return `${supabaseUrl}/storage/v1/object/public/job-photos/${encodedPath}`;
  };

  const allImages = useMemo(
    () => photos.map((p) => publicUrl(p.image_url)),
    [photos]
  );

  // ⌨️ Navegación con teclado
  useEffect(() => {
    const handleKey = (e) => {
      if (!expandedImage) return;
      const index = allImages.indexOf(expandedImage);
      if (e.key === "ArrowRight" && index < allImages.length - 1) {
        setExpandedImage(allImages[index + 1]);
      } else if (e.key === "ArrowLeft" && index > 0) {
        setExpandedImage(allImages[index - 1]);
      } else if (e.key === "Escape") {
        setExpandedImage(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [expandedImage, allImages]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin text-gray-500 w-6 h-6" />
      </div>
    );

  const role = user?.publicMetadata?.role || "user";
  const backLabel =
    role === "admin"
      ? "Volver al Dashboard"
      : role === "staff"
      ? "Volver a Mis Trabajos"
      : "Volver";

  return (
    <div className="px-6 py-10 max-w-6xl mx-auto space-y-10">
      {/* 🔙 Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4 flex-wrap gap-3"
      >
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-gray-700 dark:text-gray-200">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            {job?.title || "Untitled Job"}
          </h1>
          {job && (
            <div className="text-sm flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="w-4 h-4" />
              {new Date(job.scheduled_date).toLocaleDateString()} •{" "}
              <span className="capitalize">{job.service_type}</span> •{" "}
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  job.status === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : job.status === "in_progress"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {job.status.replace("_", " ")}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* 🔹 Comparador Before/After (versión pro) */}
      {beforePhotos.length > 0 && afterPhotos.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden bg-gradient-to-b from-white to-gray-50 shadow-xl border border-gray-200 p-6"
        >
          {(() => {
            const normalize = (val) =>
              (val || "general").toString().trim().toLowerCase();

            const pairs = [];

            beforePhotos.forEach((before, i) => {
              const beforeCat = normalize(before.category);
              const after =
                afterPhotos.find((a) => normalize(a.category) === beforeCat) ||
                afterPhotos[i];
              if (after)
                pairs.push({
                  key: beforeCat || `pair-${i}`,
                  before,
                  after,
                });
            });

            if (pairs.length === 0) {
              return (
                <div className="flex items-center justify-center h-48 text-gray-500 italic">
                  No paired before/after comparisons found.
                </div>
              );
            }

            const total = pairs.length;

            const nextSlide = () =>
              setCurrentIndex((prev) => (prev + 1) % total);
            const prevSlide = () =>
              setCurrentIndex((prev) => (prev - 1 + total) % total);

            return (
              <div className="relative flex flex-col items-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={pairs[currentIndex].key}
                    initial={{ opacity: 0, x: 80 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -80 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full"
                  >
                    <div className="text-center text-sm font-medium bg-gray-900 text-white py-1.5 rounded-md mb-4 uppercase tracking-wide shadow-sm">
                      {pairs[currentIndex].key.replace("_", " ")}
                    </div>

                    <div className="relative aspect-video w-full max-w-5xl mx-auto overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-shadow duration-300 ease-out bg-transparent rounded-none">
                      <div className="absolute inset-0 flex items-center justify-center p-0 bg-transparent">
                        <ReactCompareImage
                          leftImage={publicUrl(
                            pairs[currentIndex].before.image_url
                          )}
                          rightImage={publicUrl(
                            pairs[currentIndex].after.image_url
                          )}
                          leftImageLabel="Before"
                          rightImageLabel="After"
                          sliderLineColor="#2563eb"
                          handle={
                            <div className="flex items-center justify-center">
                              <div className="bg-blue-500 w-[3px] h-20 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.6)] ring-2 ring-white/30 backdrop-blur-sm" />
                            </div>
                          }
                          leftImageCss={{
                            objectFit: "cover",
                            objectPosition: "center",
                            backgroundColor: "transparent !important",
                            borderRadius: "0 !important", // 🔹 elimina curvatura de las imágenes
                          }}
                          rightImageCss={{
                            objectFit: "cover",
                            objectPosition: "center",
                            backgroundColor: "transparent !important",
                            borderRadius: "0 !important",
                          }}
                          style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: "transparent !important",
                            borderRadius: "0 !important", // 🔹 elimina curvatura del wrapper interno
                          }}
                        />
                      </div>

                      {/* 💡 Luz sutil superior opcional */}
                      <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/5 to-transparent pointer-events-none" />

                      {/* 🔧 CSS global para forzar sin borde */}
                      <style jsx global>{`
                        .__rc-slider,
                        .__rc-image-container,
                        .__rc-wrapper {
                          background-color: transparent !important;
                          border-radius: 0 !important;
                        }
                      `}</style>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* 🔹 Flechas tipo glass */}
                <button
                  onClick={prevSlide}
                  className="absolute left-5 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg transition-all hover:scale-110"
                  aria-label="Previous"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-700" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-5 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg transition-all hover:scale-110"
                  aria-label="Next"
                >
                  <ArrowLeft className="rotate-180 w-6 h-6 text-gray-700" />
                </button>

                {/* 🔹 Indicadores premium */}
                <div className="absolute bottom-4 flex justify-center gap-3">
                  {pairs.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        idx === currentIndex
                          ? "bg-blue-600 w-6 shadow-md"
                          : "bg-gray-300 w-2.5 hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })()}
        </motion.div>
      ) : (
        <p className="text-gray-500 italic text-sm text-center">
          No paired before/after comparisons yet.
        </p>
      )}

      {/* 🔹 Galería completa */}
      <div className="space-y-8">
        {["before", "after"].map((type) => {
          const list = type === "before" ? beforePhotos : afterPhotos;
          const title = type === "before" ? "Before Photos" : "After Photos";
          const color =
            type === "before" ? "text-yellow-600" : "text-green-600";

          return (
            <section key={type}>
              <h2 className={`text-xl font-semibold mb-3 ${color}`}>{title}</h2>
              {list.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {list.map((p) => (
                    <motion.div
                      key={p.id || p.image_url}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition cursor-zoom-in"
                      onClick={() => setExpandedImage(publicUrl(p.image_url))}
                    >
                      <Image
                        src={publicUrl(p.image_url)}
                        alt={p.category || type}
                        width={400}
                        height={400}
                        className="object-cover w-full h-48"
                      />
                      {p.category && (
                        <div className="text-center text-sm py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 capitalize">
                          {p.category.replace("_", " ")}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  No {type} photos uploaded.
                </p>
              )}
            </section>
          );
        })}

        {generalPhotos.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-600">
              General Photos
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {generalPhotos.map((p) => (
                <motion.div
                  key={p.id || p.image_url}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition cursor-zoom-in"
                  onClick={() => setExpandedImage(publicUrl(p.image_url))}
                >
                  <Image
                    src={publicUrl(p.image_url)}
                    alt={p.category || "photo"}
                    width={400}
                    height={400}
                    className="object-cover w-full h-48"
                  />
                  {p.category && (
                    <div className="text-center text-sm py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 capitalize">
                      {p.category.replace("_", " ")}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ✅ Toolbar de compartir */
import {
  Facebook,
  MessageCircle,
  Clipboard,
  Check,
  PhoneCall,
} from "lucide-react";

function ToolbarActions({ expandedImage }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(expandedImage);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const openPopup = (url) => {
    window.open(url, "_blank", "width=600,height=600");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute top-6 right-6 flex items-center gap-2 z-[10000] bg-black/40 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl border border-white/10"
    >
      <button
        onClick={handleCopy}
        title="Copiar enlace"
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium shadow transition-all duration-200 ${
          copied
            ? "bg-green-600 text-white"
            : "bg-gray-700/90 hover:bg-gray-600 text-white"
        }`}
      >
        {copied ? (
          <>
            <Check size={16} /> Copiado
          </>
        ) : (
          <>
            <Clipboard size={16} /> Copiar
          </>
        )}
      </button>

      <button
        title="Compartir en Facebook"
        onClick={(e) => {
          e.stopPropagation();
          const shareUrl = `https://www.facebook.com/dialog/share?app_id=9706242499500551&href=${encodeURIComponent(
            expandedImage
          )}&display=popup`;
          openPopup(shareUrl);
        }}
        className="p-2.5 rounded-full bg-[#1877F2] hover:bg-[#145dbf] text-white shadow-md transition-transform hover:scale-110"
      >
        <Facebook size={18} />
      </button>

      <button
        title="Enviar por Messenger"
        onClick={(e) => {
          e.stopPropagation();
          const appId = "9706242499500551";
          const link = encodeURIComponent(expandedImage);
          const redirectUri = encodeURIComponent(window.location.href);
          const messengerUrl = `https://www.facebook.com/dialog/send?app_id=${appId}&link=${link}&redirect_uri=${redirectUri}`;
          openPopup(messengerUrl);
        }}
        className="p-2.5 rounded-full bg-[#0099FF] hover:bg-[#007bdb] text-white shadow-md transition-transform hover:scale-110"
      >
        <MessageCircle size={18} />
      </button>

      <button
        title="Compartir en WhatsApp"
        onClick={(e) => {
          e.stopPropagation();
          const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
            expandedImage
          )}`;
          openPopup(whatsappUrl);
        }}
        className="p-2.5 rounded-full bg-[#25D366] hover:bg-[#1DA851] text-white shadow-md transition-transform hover:scale-110"
      >
        <PhoneCall size={18} />
      </button>
    </motion.div>
  );
}
