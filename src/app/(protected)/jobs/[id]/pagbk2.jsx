"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react"; // ✅ unificado
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import {
  Loader2,
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  CheckCircle,
} from "lucide-react";
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
  const [selectMode, setSelectMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);

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
      if (e.key === "Escape") {
        if (expandedImage) setExpandedImage(null);
        else if (selectMode) setSelectMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedImage, selectMode]);

  // 🔹 Categorías de fotos
  const beforePhotos = photos.filter((p) => p.type === "before");
  const afterPhotos = photos.filter((p) => p.type === "after");

  // 🔹 URLs públicas
  const publicUrl = (path) =>
    `${supabaseUrl}/storage/v1/object/public/job-photos/${path}`;

  // ✅ useMemo antes de cualquier return
  const allImages = useMemo(
    () => photos.map((p) => publicUrl(p.image_url)),
    [photos]
  );

  // ✅ Evitamos el error de orden de hooks
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

  const toggleSelect = (url) => {
    setSelectedImages((prev) =>
      prev.includes(url) ? prev.filter((i) => i !== url) : [...prev, url]
    );
  };

  return (
    <div className="px-6 py-10 max-w-6xl mx-auto space-y-10">
      {/* 🔙 Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4 flex-wrap gap-3"
      >
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Button>

          <Button
            variant={selectMode ? "default" : "outline"}
            onClick={() => {
              setSelectMode(!selectMode);
              if (selectMode) setSelectedImages([]);
            }}
            className="flex items-center gap-2 text-sm"
          >
            <CheckCircle className="w-4 h-4" />
            {selectMode ? "Cancelar selección" : "Seleccionar fotos"}
          </Button>
        </div>

        {selectMode && selectedImages.length > 0 && (
          <ToolbarActions selectedImages={selectedImages} />
        )}
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
              <button
                onClick={() => setExpandedImage(null)}
                className="absolute top-6 left-6 z-[10000] rounded-full bg-black/40 hover:bg-black/60 text-white p-2 transition"
                aria-label="Close"
              >
                ✕
              </button>

              <ToolbarActions expandedImage={expandedImage} />

              {/* Navegación */}
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
                  {list.map((p) => {
                    const url = publicUrl(p.image_url);
                    const selected = selectedImages.includes(url);
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative rounded-lg overflow-hidden shadow-md transition cursor-pointer ${
                          selected ? "ring-4 ring-blue-500" : "hover:shadow-xl"
                        }`}
                        onClick={() =>
                          selectMode ? toggleSelect(url) : setExpandedImage(url)
                        }
                      >
                        <Image
                          src={url}
                          alt={p.category || type}
                          width={400}
                          height={400}
                          className="object-cover w-full h-48"
                        />
                        {selectMode && (
                          <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                            {selected ? (
                              <CheckCircle className="text-green-400 w-4 h-4" />
                            ) : (
                              <Clipboard className="text-white w-4 h-4" />
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
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

/* ✅ ToolbarActions con compartir múltiple */
import {
  Facebook,
  MessageCircle,
  Clipboard,
  Check,
  PhoneCall,
} from "lucide-react";

function ToolbarActions({ expandedImage, selectedImages = [] }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    const content = selectedImages.length
      ? selectedImages.join("\n")
      : expandedImage;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const openPopup = (url) => {
    window.open(url, "_blank", "width=600,height=600");
  };

  const shareText = encodeURIComponent(
    selectedImages.length ? selectedImages.join("\n") : expandedImage
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute top-6 right-6 flex items-center gap-2 z-[10000] bg-black/40 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl border border-white/10"
    >
      <button
        onClick={handleCopy}
        title="Copiar enlaces"
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
          const url = `https://www.facebook.com/dialog/share?app_id=9706242499500551&href=${shareText}&display=popup`;
          openPopup(url);
        }}
        className="p-2.5 rounded-full bg-[#1877F2] hover:bg-[#145dbf] text-white shadow-md transition-transform hover:scale-110"
      >
        <Facebook size={18} />
      </button>

      <button
        title="Enviar por Messenger"
        onClick={(e) => {
          e.stopPropagation();
          const messengerUrl = `https://www.facebook.com/dialog/send?app_id=9706242499500551&link=${shareText}&redirect_uri=${encodeURIComponent(
            window.location.href
          )}`;
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
          const url = `https://api.whatsapp.com/send?text=${shareText}`;
          openPopup(url);
        }}
        className="p-2.5 rounded-full bg-[#25D366] hover:bg-[#1DA851] text-white shadow-md transition-transform hover:scale-110"
      >
        <PhoneCall size={18} />
      </button>
    </motion.div>
  );
}
