"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import { Loader2, ArrowLeft, CalendarDays, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import Slider from "@/components/Slider";

const ReactCompareImage = dynamic(() => import("react-compare-image"), {
  ssr: false,
});

export default function JobPhotosPage() {
  const { id } = useParams(); // job_id
  const router = useRouter();
  const { user } = useUser();

  const [photos, setPhotos] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 🔹 Fetch job info + photos
  useEffect(() => {
    if (!id) return;
    fetchJobDetails(id);
  }, [id]);

  async function fetchJobDetails(jobId) {
    try {
      setLoading(true);
      const supabase = createClient(supabaseUrl, supabaseAnon);

      // ✅ Obtener información del trabajo
      const { data: jobData, error: jobError } = await supabase
        .from("cleaning_jobs")
        .select("id, title, service_type, scheduled_date, status")
        .eq("id", jobId)
        .maybeSingle();

      if (jobError) throw jobError;
      setJob(jobData);

      // 🔹 Obtener fotos relacionadas
      const { data: photoData, error: photoError } = await supabase
        .from("job_photos")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });

      if (photoError) throw photoError;
      setPhotos(photoData || []);
    } catch (err) {
      console.error("❌ Error fetching job/photos:", err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin text-gray-500 w-6 h-6" />
      </div>
    );

  const beforePhotos = photos.filter((p) => p.type === "before");
  const afterPhotos = photos.filter((p) => p.type === "after");

  const publicUrl = (path) =>
    `${supabaseUrl}/storage/v1/object/public/job-photos/${path}`;

  // 🔙 Texto dinámico del botón "Volver"
  const role = user?.publicMetadata?.role || "user";
  const backLabel =
    role === "admin"
      ? "Volver al Dashboard"
      : role === "staff"
      ? "Volver a Mis Trabajos"
      : "Volver";

  return (
    <div className="px-6 py-10 max-w-6xl mx-auto space-y-10">
      {/* 🔙 Botón Volver + Detalles del trabajo */}
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

      {/* 🔹 Slider de comparaciones por categoría */}
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
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* 🏷️ Nombre de la categoría arriba */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/50 text-white text-sm px-3 py-1 rounded-full capitalize">
                      {category.replace("_", " ")}
                    </div>

                    {/* 🖼️ Comparador before/after */}
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
        <section>
          <h2 className="text-xl font-semibold mb-3 text-yellow-600">
            Before Photos
          </h2>
          {beforePhotos.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {beforePhotos.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition"
                >
                  <Image
                    src={publicUrl(p.image_url)}
                    alt={p.category || "before"}
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
            <p className="text-gray-500 text-sm">No before photos uploaded.</p>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-green-600">
            After Photos
          </h2>
          {afterPhotos.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {afterPhotos.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition"
                >
                  <Image
                    src={publicUrl(p.image_url)}
                    alt={p.category || "after"}
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
            <p className="text-gray-500 text-sm">No after photos uploaded.</p>
          )}
        </section>
      </div>
    </div>
  );
}
