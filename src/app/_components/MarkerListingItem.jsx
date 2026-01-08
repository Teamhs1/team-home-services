import { Bath, BedDouble, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

function MarkerListingItem({ item }) {
  const imageUrl =
    item.listingimages?.length > 0
      ? item.listingimages[0].url
      : "/placeholder.jpg";

  return (
    <Link href={`/view-listing/${item.id}`} className="block">
      <div className="relative w-[180px] cursor-pointer rounded-lg">
        <Image
          src={imageUrl}
          width={800}
          height={150}
          loading="lazy" // ✅ importante
          className="h-[110px] w-[180px] rounded-lg object-cover"
          alt={`Imagen de propiedad en ${
            item.address || "ubicación desconocida"
          }`}
        />
        <div className="mt-2 flex flex-col gap-2 bg-white p-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">${item?.price}</h2>
            <span className="text-base font-bold text-primary">View</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin className="h-4 w-4" />
            <span className="break-words text-xs leading-snug">
              {item.address}
            </span>
          </div>
          <div className="mt-2 flex justify-between gap-2">
            <div className="flex w-full items-center justify-center gap-1 rounded-md bg-slate-200 p-1 text-xs text-gray-500">
              <BedDouble className="h-4 w-4" />
              {item?.bedroom}
            </div>
            <div className="flex w-full items-center justify-center gap-1 rounded-md bg-slate-200 p-1 text-xs text-gray-500">
              <Bath className="h-4 w-4" />
              {item?.bathroom}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default MarkerListingItem;
