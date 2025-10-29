"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import { Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

const ReactCompareImage = dynamic(() => import("react-compare-image"), {
  ssr: false,
});

export default function JobPhotosPage() {
  const { id } = useParams(); // job_id
  const router = useRouter();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    if (!id) return;
    fetchJobPhotos(id);
  }, [id]);

  async function fetchJobPhotos(jobId) {
    try {
      setLoading(true);
      const supabase = createClient(supabaseUrl, supabaseAnon);

      const { data, error } = await supabase
        .from("job_photos")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setPhotos(data || []);
    } catch (err) {
      console.error("❌ Error fetching photos:", err.message);
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

  const mainBefore = beforePhotos[0];
  const mainAfter = afterPhotos[0];

  return (
    <div className="px-6 py-10 max-w-6xl mx-auto space-y-10">
      {/* 🔙 Botón Volver */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>

        <h1 className="text-3xl font-bold flex items-center gap-2">
          📸 Job Gallery
        </h1>
      </motion.div>

      {/* 🔹 Slider comparativo Before/After */}
      {mainBefore && mainAfter ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200"
        >
          <ReactCompareImage
            leftImage={publicUrl(mainBefore.image_url)}
            rightImage={publicUrl(mainAfter.image_url)}
            leftImageLabel="Before"
            rightImageLabel="After"
            sliderLineColor="#2563eb"
            handle={
              <div className="bg-blue-500 w-1 h-32 rounded-full shadow-md" />
            }
          />
        </motion.div>
      ) : (
        <p className="text-gray-500 italic text-sm">
          No paired before/after images yet.
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
