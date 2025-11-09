"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react"; // ✅ unificado
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import { Loader2, ArrowLeft, CalendarDays, ClipboardList } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import Slider from "@/components/Slider";

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

  // 🔹 Cargar trabajo y fotos
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const supabase = createClient(supabaseUrl, supabaseAnon);

        const { data: jobData } = await supabase
          .from("cleaning_jobs")
          .select("id, title, service_type, scheduled_date, status")
          .eq("id", id)
          .maybeSingle();

        setJob(jobData || null);

        const { data: photoData } = await supabase
          .from("job_photos")
          .select("*")
          .eq("job_id", id)
          .order("created_at", { ascending: true });

        setPhotos(photoData || []);
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

  // 🔹 Categorías de fotos
  const beforePhotos = photos.filter((p) => p.type === "before");
  const afterPhotos = photos.filter((p) => p.type === "after");

  // ✅ URLs públicas seguras (sin errores 400)
  const publicUrl = (path) => {
    if (!path) return "";

    // Limpia el prefijo "job-photos/" si viene repetido
    const cleanPath = path.replace(/^\/?job-photos\//, "").trim();

    // Codifica cada segmento del path
    const encodedPath = cleanPath
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");

    // Devuelve la URL final válida
    return `${supabaseUrl}/storage/v1/object/public/job-photos/${encodedPath}`;
  };

  // ✅ useMemo antes de cualquier return
  const allImages = useMemo(
    () => photos.map((p) => publicUrl(p.image_url)),
    [photos]
  );

  // ✅ Evitamos el error de orden de hooks
  useEffect(() => {
    const handleKey = (e) => {
      // siempre se ejecuta, pero ignora si no hay imagen expandida
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

  // 🟢 Return condicional al final de todos los hooks
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

      {/* 🔹 Slider comparativo */}
      {beforePhotos.length && afterPhotos.length ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200"
        >
          <Slider
            imageList={Array.from(new Set(beforePhotos.map((p) => p.category)))
              .map((category) => {
                const before = beforePhotos.find(
                  (b) => b.category === category
                );
                const after = afterPhotos.find((a) => a.category === category);
                if (!before || !after) return null;

                return (
                  <div
                    key={category}
                    className="no-swipe relative w-full h-full"
                    onPointerDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/50 text-white text-sm px-3 py-1 rounded-full capitalize">
                      {category.replace("_", " ")}
                    </div>

                    <ReactCompareImage
                      leftImage={publicUrl(before.image_url)}
                      rightImage={publicUrl(after.image_url)}
                      leftImageLabel="Before"
                      rightImageLabel="After"
                      sliderLineColor="#2563eb"
                      handle={
                        <div className="bg-blue-500 w-1 h-32 rounded-full shadow-md" />
                      }
                    />
                  </div>
                );
              })
              .filter(Boolean)}
            mini={false}
            disableFullscreen={true}
          />
        </motion.div>
      ) : (
        <p className="text-gray-500 italic text-sm">
          No paired before/after comparisons yet.
        </p>
      )}

      {/* 🔹 Galería completa */}
      <div className="space-y-8">
        <AnimatePresence>
          {expandedImage && (
            <motion.div
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setExpandedImage(null);
              }}
            >
              {/* 🔘 Cerrar */}
              <button
                onClick={() => setExpandedImage(null)}
                className="absolute top-6 left-6 z-[10000] rounded-full bg-black/40 hover:bg-black/60 text-white p-2 transition"
                aria-label="Close"
              >
                ✕
              </button>

              {/* 🧭 Toolbar */}
              <ToolbarActions expandedImage={expandedImage} />

              {/* ⬅️ / ➡️ navegación */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const index = allImages.indexOf(expandedImage);
                  if (index > 0) setExpandedImage(allImages[index - 1]);
                }}
                className="absolute left-6 text-white bg-black/40 hover:bg-black/60 p-3 rounded-full z-[10000] transition"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const index = allImages.indexOf(expandedImage);
                  if (index < allImages.length - 1)
                    setExpandedImage(allImages[index + 1]);
                }}
                className="absolute right-6 text-white bg-black/40 hover:bg-black/60 p-3 rounded-full z-[10000] transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>

              {/* 🖼 Imagen fullscreen con fade suave */}
              <motion.img
                key={expandedImage}
                src={expandedImage}
                alt="Expanded"
                className="max-w-[92vw] max-h-[90vh] object-contain rounded-xl shadow-2xl border border-white/10"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Before / After */}
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
                      key={p.id}
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
      </div>
    </div>
  );
}

/* ✅ Toolbar con compartir — versión profesional UI/UX */
import {
  Facebook,
  MessageCircle,
  Clipboard,
  Check,
  Share2,
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
      {/* 📋 Copiar */}
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

      {/* 🌐 Facebook */}
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

      {/* 💬 Messenger */}
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

      {/* 🟢 WhatsApp */}
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
