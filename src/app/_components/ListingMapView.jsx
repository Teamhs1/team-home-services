"use client";

import React, { useEffect, useState, useRef } from "react";
import Listing from "./Listing";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Loader2, MapPinOff, MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const GoogleMapSection = dynamic(() => import("./GoogleMapSection"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center text-muted-foreground">
      Cargando mapa...
    </div>
  ),
});

const mapStyle = [
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  {
    featureType: "transit",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#d1e6dd" }],
  },
  { featureType: "water", stylers: [{ color: "#aadaff" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#f9f9f9" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8c8c8c" }],
  },
];

function ListingMapView({ type }) {
  const [listing, setListing] = useState([]);
  const [searchedAddress, setSearchedAddress] = useState();
  const [bedCount, setBedCount] = useState();
  const [bathCount, setBathCount] = useState();
  const [parkingCount, setParkingCount] = useState();
  const [homeType, setHomeType] = useState();
  const [coordinates, setCoordinates] = useState();
  const [availability, setAvailability] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [showMap, setShowMap] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredListingId, setHoveredListingId] = useState(null);
  const sidebarRef = useRef(null);
  const cardsRef = useRef(null);
  const profileRef = useRef(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      const fullAddress = searchedAddress?.label?.toLowerCase().trim();

      let query = supabase
        .from("listing")
        .select(`*, listingimages (url, listing_id)`)
        .eq("active", true)
        .eq("type", type);

      if (bedCount !== undefined)
        query = query.gte("bedroom", Number(bedCount));

      if (bathCount !== undefined)
        query = query.or(`bathroom.gte.${Number(bathCount)},bathroom.is.null`);
      if (parkingCount !== undefined)
        query = query.or(`parking.gte.${Number(parkingCount)},parking.is.null`);
      if (fullAddress) query = query.ilike("address", `%${fullAddress}%`);
      if (homeType) query = query.eq("propertyType", homeType);
      if (availability) query = query.gte("availability", availability);

      if (sortBy) {
        if (sortBy === "price-asc")
          query = query.order("price", { ascending: true });
        else if (sortBy === "price-desc")
          query = query.order("price", { ascending: false });
        else if (sortBy === "date-asc")
          query = query.order("created_at", { ascending: true });
        else if (sortBy === "date-desc")
          query = query.order("created_at", { ascending: false });
      } else {
        query = query.order("id", { ascending: false });
      }

      const { data, error } = await query;
      setIsLoading(false);

      if (error) {
        console.error(error);
        toast.error("Error fetching properties");
        return;
      }

      if (!data || data.length === 0) {
        toast("No se encontraron propiedades con los filtros");
      }

      const incomplete = data.filter(
        (item) =>
          item.bedroom == null ||
          item.bathroom == null ||
          item.propertyType == null ||
          item.type == null
      );

      if (incomplete.length > 0) {
        toast.warning(
          `⚠️ ${incomplete.length} propiedades tienen datos incompletos`
        );
      }

      setListing(data);
    };

    fetchListings();
  }, [
    searchedAddress,
    bedCount,
    bathCount,
    parkingCount,
    homeType,
    availability,
    sortBy,
    type,
  ]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const outsideMap =
        sidebarRef.current && !sidebarRef.current.contains(e.target);
      const outsideCards =
        cardsRef.current && !cardsRef.current.contains(e.target);
      const outsideProfile =
        profileRef.current && !profileRef.current.contains(e.target);

      if (outsideMap && outsideCards && outsideProfile) {
        setShowMap(false);
        setIsMapExpanded(false);
      }
    };

    if (showMap) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMap]);

  return (
    <div className="relative w-full bg-white">
      <div
        className={`fixed z-50 hidden items-center transition-all duration-300 ease-in-out md:flex ${
          isMapExpanded
            ? "left-1/2 top-[140px] -translate-x-1/2 transform"
            : showMap
            ? "right-[38.5%] top-1/2 -translate-y-1/2 transform"
            : "right-4 top-1/2 -translate-y-1/2 transform"
        }`}
      >
        <Button
          onClick={() => {
            setShowMap((prev) => {
              const next = !prev;
              if (!next) setIsMapExpanded(false);
              return next;
            });
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full border bg-white text-gray-600 shadow-md transition-colors duration-200 hover:bg-primary hover:text-white"
        >
          {showMap ? (
            <MapPinOff className="h-8 w-8 text-inherit" />
          ) : (
            <MapPin className="h-8 w-8 text-inherit" />
          )}
        </Button>
      </div>

      <AnimatePresence>
        {showMap &&
          typeof window !== "undefined" &&
          window.innerWidth >= 768 && (
            <motion.div
              key="properties-text"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              className="fixed right-[80px] top-[140px] z-50 hidden items-center rounded-full bg-black/70 px-4 py-2 text-sm text-white shadow-md md:flex"
            >
              {listing.length} Properties found
            </motion.div>
          )}
      </AnimatePresence>

      <div className="fixed bottom-4 right-4 z-50 md:hidden">
        <Button
          onClick={() => setShowMap((prev) => !prev)}
          className="flex items-center gap-2 rounded-full border bg-purple-800 px-4 py-2 text-sm text-white shadow-md md:flex"
        >
          {showMap ? (
            <MapPinOff className="h-4 w-4" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
          {showMap ? "Ocultar mapa" : "Mostrar mapa"}
        </Button>
      </div>

      <div
        ref={cardsRef}
        className={`grid gap-3 px-1 py-3 transition-all duration-300 ${
          showMap ? "pr-[calc(40%+16px)]" : "pr-0"
        }`}
        style={{
          gridTemplateColumns: showMap
            ? "repeat(auto-fit, minmax(340px, 1fr))"
            : "repeat(auto-fit, minmax(240px, 1fr))",
          justifyContent: "start",
        }}
      >
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : (
          <Listing
            listing={listing}
            searchedAddress={setSearchedAddress}
            setBathCount={setBathCount}
            setBedCount={setBedCount}
            setParkingCount={setParkingCount}
            setHomeType={setHomeType}
            setCoordinates={setCoordinates}
            setAvailability={setAvailability}
            setSortBy={setSortBy}
            columns={showMap ? 3 : 6}
            hoveredListingId={hoveredListingId}
            setHoveredListingId={setHoveredListingId}
            isMapExpanded={isMapExpanded} // 👈 agrega esta línea
          />
        )}
      </div>

      <AnimatePresence>
        {showMap && (
          <motion.aside
            key="sidebar-map"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3 }}
            ref={sidebarRef}
            className={`fixed top-0 z-40 h-screen bg-white shadow-lg ${
              typeof window !== "undefined" && window.innerWidth < 768
                ? "left-0 w-full"
                : "right-0 w-[40%]"
            }`}
          >
            {typeof window !== "undefined" && window.innerWidth < 768 && (
              <button
                onClick={() => setShowMap(false)}
                className="absolute right-4 top-4 z-50 rounded-full bg-white px-3 py-1 text-sm font-semibold shadow hover:bg-red-500 hover:text-white"
              >
                Cerrar
              </button>
            )}
            <div className="h-full w-full overflow-hidden">
              <GoogleMapSection
                listing={listing}
                coordinates={coordinates}
                hoveredListingId={hoveredListingId}
                setHoveredListingId={setHoveredListingId}
                onExpandChange={setIsMapExpanded}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ListingMapView;
