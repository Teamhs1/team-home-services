"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function JobGallery({
  beforePhotos,
  afterPhotos,
  generalPhotos,
  publicUrl,
}) {
  return (
    <div className="space-y-8">
      {[
        ["before", beforePhotos],
        ["after", afterPhotos],
      ].map(([type, list]) => (
        <section key={type}>
          <h2
            className={`text-xl font-semibold mb-3 ${
              type === "before" ? "text-yellow-600" : "text-green-600"
            }`}
          >
            {type === "before" ? "Before Photos" : "After Photos"}
          </h2>

          {list.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {list.map((p) => (
                <motion.div
                  key={p.id || p.image_url}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-lg overflow-hidden shadow-md"
                >
                  <Image
                    src={publicUrl(p.image_url)}
                    alt={p.category || type}
                    width={400}
                    height={400}
                    className="object-cover w-full h-48"
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No {type} photos uploaded.</p>
          )}
        </section>
      ))}

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
                className="rounded-lg overflow-hidden shadow-md"
              >
                <Image
                  src={publicUrl(p.image_url)}
                  alt={p.category}
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
  );
}
