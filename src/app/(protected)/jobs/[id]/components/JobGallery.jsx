"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import FullscreenViewer from "@/components/FullscreenViewer";

export default function JobGallery({
  beforePhotos,
  afterPhotos,
  generalPhotos,
  publicUrl,
}) {
  // ------------------------------
  // 🔥 FULLSCREEN STATE
  // ------------------------------
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenImages, setFullscreenImages] = useState([]);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);

  // ------------------------------
  // 🔥 OPEN FULLSCREEN
  // ------------------------------
  const openFullscreen = (list, index) => {
    const urls = list.map((p) => publicUrl(p.image_url));
    setFullscreenImages(urls);
    setFullscreenIndex(index);
    setIsFullscreen(true);
  };

  return (
    <>
      <div className="space-y-8">
        {/* ===============================
            BEFORE PHOTOS
        =============================== */}
        {beforePhotos.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-3 text-yellow-600">
              Before Photos
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {beforePhotos.map((p, i) => (
                <motion.div
                  key={p.id || p.image_url}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-lg overflow-hidden shadow-md cursor-pointer"
                  onClick={() => openFullscreen(beforePhotos, i)}
                >
                  <Image
                    src={publicUrl(p.image_url)}
                    alt="before"
                    width={400}
                    height={400}
                    className="object-cover w-full h-48"
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ===============================
            AFTER PHOTOS
        =============================== */}
        {afterPhotos.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-3 text-green-600">
              After Photos
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {afterPhotos.map((p, i) => (
                <motion.div
                  key={p.id || p.image_url}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-lg overflow-hidden shadow-md cursor-pointer"
                  onClick={() => openFullscreen(afterPhotos, i)}
                >
                  <Image
                    src={publicUrl(p.image_url)}
                    alt="after"
                    width={400}
                    height={400}
                    className="object-cover w-full h-48"
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ===============================
            GENERAL PHOTOS
        =============================== */}
        {generalPhotos.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-600">
              General Photos
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {generalPhotos.map((p, i) => (
                <motion.div
                  key={p.id || p.image_url}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-lg overflow-hidden shadow-md cursor-pointer"
                  onClick={() => openFullscreen(generalPhotos, i)}
                >
                  <Image
                    src={publicUrl(p.image_url)}
                    alt="general"
                    width={400}
                    height={400}
                    className="object-cover w-full h-48"
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* -----------------------------------------------
          🔥 FULLSCREEN VIEWER
      ------------------------------------------------ */}
      {isFullscreen && (
        <FullscreenViewer
          images={fullscreenImages}
          index={fullscreenIndex}
          setIndex={setFullscreenIndex}
          onClose={() => setIsFullscreen(false)}
        />
      )}
    </>
  );
}
