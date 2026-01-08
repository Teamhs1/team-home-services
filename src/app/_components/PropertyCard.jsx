"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BedDouble, Bath, Star, MapPin } from "lucide-react";
import Slider from "@/app/_components/Slider";

function PropertyCard({ item, onHover, hoveredListingId }) {
  const router = useRouter();
  const [isPressed, setIsPressed] = useState(false);

  const isNew =
    item.created_at &&
    new Date(item.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const handleCardClick = (e) => {
    const ignoreClick =
      e.target.closest(".slider-arrow") ||
      e.target.closest(".slider-indicator") ||
      e.target.closest(".pause-button");

    if (!ignoreClick) {
      router.push(`/view-listing/${item.id}`);
    }
  };

  return (
    <div
      key={item.id}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
      onClick={handleCardClick}
      onMouseDown={(e) => {
        const isSlider =
          e.target.closest(".slider-arrow") ||
          e.target.closest(".slider-indicator") ||
          e.target.closest(".pause-button");
        if (!isSlider) setIsPressed(true);
      }}
      onMouseUp={() => setIsPressed(false)}
      className={`relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 ease-out hover:shadow-lg ${
        isPressed ? "scale-95" : "hover:scale-[1.02]"
      }`}
    >
      <div className="relative h-[200px] overflow-hidden rounded-t-2xl">
        {isNew && (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-primary px-4 py-1 text-sm font-semibold text-white shadow">
            New
          </div>
        )}
        {item.listingimages?.length > 0 ? (
          <Slider
            imageList={item.listingimages}
            disableFullscreen
            mini
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-base text-gray-500">
            No Image
          </div>
        )}
      </div>

      <div className="px-6 pb-4 pt-2">
        <div className="space-y-2">
          {/* Tipo de propiedad */}
          {item.propertyType && (
            <p className="text-lg font-semibold capitalize text-primary">
              {item.propertyType}
            </p>
          )}

          {/* Dirección */}
          <h2 className="break-words text-xl font-semibold leading-snug text-gray-900">
            {item.address}
          </h2>

          {/* Distancia y precio */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-base text-muted-foreground">
              <MapPin className="h-5 w-5" />
              <span>87 km away</span>
            </div>
            <span className="text-lg font-bold text-primary">
              ${item.price}
              <span className="text-base font-normal text-gray-500"> /mo</span>
            </span>
          </div>

          {/* Fecha */}
          {item.availability && (
            <p className="text-base text-muted-foreground">
              Available from:{" "}
              {new Date(item.availability).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          )}
        </div>
      </div>

      {/* Footer: características */}
      <div className="mt-auto rounded-b-2xl bg-muted/40 px-6 py-4 text-lg text-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <BedDouble className="h-6 w-6" />
              {item.bedroom}
            </div>
            <div className="flex items-center gap-2">
              <Bath className="h-6 w-6" />
              {item.bathroom}
            </div>
          </div>
          <div className="flex items-center gap-2 text-base text-gray-500">
            <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
            <span>4.94</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertyCard;
