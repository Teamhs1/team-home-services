"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import FullscreenViewer from "@/components/FullscreenViewer";

export default function JobGallery({
  beforePhotos = [],
  afterPhotos = [],
  generalPhotos = [],
  publicUrl,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenImages, setFullscreenImages] = useState([]);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);

  const openFullscreen = (list, index) => {
    const urls = list.map((p) =>
      publicUrl(p.image_url || p.file_path || p.path)
    );
    setFullscreenImages(urls);
    setFullscreenIndex(index);
    setIsFullscreen(true);
  };

  return (
    <>
      <div className="space-y-8">
        {/* BEFORE */}
        {beforePhotos.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-3 text-yellow-600">
              Before Photos
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {beforePhotos.map((p, i) => (
                <motion.div
                  key={p.id || p.image_url || p.file_path || p.path}
                  onClick={() => openFullscreen(beforePhotos, i)}
                  className="rounded-lg overflow-hidden shadow-md cursor-pointer"
                >
                  <Image
                    src={publicUrl(p.image_url || p.file_path || p.path)}
                    alt="before"
                    width={400}
                    height={400}
                    unoptimized
                    className="object-cover w-full h-48"
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* AFTER */}
        {afterPhotos.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-3 text-green-600">
              After Photos
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {afterPhotos.map((p, i) => (
                <motion.div
                  key={p.id || p.image_url || p.file_path || p.path}
                  onClick={() => openFullscreen(afterPhotos, i)}
                  className="rounded-lg overflow-hidden shadow-md cursor-pointer"
                >
                  <Image
                    src={publicUrl(p.image_url || p.file_path || p.path)}
                    alt="after"
                    width={400}
                    height={400}
                    unoptimized
                    className="object-cover w-full h-48"
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* FINAL / GENERAL */}
        {generalPhotos.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-600">
              Final / General Photos
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {generalPhotos.map((p, i) => (
                <motion.div
                  key={p.id || p.image_url || p.file_path || p.path}
                  onClick={() => openFullscreen(generalPhotos, i)}
                  className="rounded-lg overflow-hidden shadow-md cursor-pointer"
                >
                  <Image
                    src={publicUrl(p.image_url || p.file_path || p.path)}
                    alt="final"
                    width={400}
                    height={400}
                    unoptimized
                    className="object-cover w-full h-48"
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>

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
