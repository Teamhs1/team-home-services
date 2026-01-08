"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { GoogleMap } from "@react-google-maps/api";
import MarkerItem from "./MarkerItem";
import SingleMarkerItem from "./SingleMarkerItem";
import lightMapStyle from "@/utils/MapStyles/airbnbMapStyle";
import darkMapStyle from "@/utils/MapStyles/darkMapStyle";

const containerStyle = {
  width: "100%",
  height: "100%",
};

function GoogleMapSection({
  coordinates,
  listing = [],
  hoveredListingId,
  setHoveredListingId,
  onExpandChange,
  customMarker = null,
}) {
  const [center, setCenter] = useState({ lat: 40.73061, lng: -73.935242 });
  const [map, setMap] = useState(null);
  const [mapType, setMapType] = useState("roadmap");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const isGoogleReady = useMemo(() => {
    return (
      typeof window !== "undefined" &&
      window.google?.maps?.Map &&
      window.google?.maps?.LatLng &&
      window.google?.maps?.LatLngBounds
    );
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateMode = () => setIsDarkMode(mediaQuery.matches);
    updateMode();
    mediaQuery.addEventListener("change", updateMode);
    return () => mediaQuery.removeEventListener("change", updateMode);
  }, []);

  const getMapOptions = useCallback(() => {
    const isDesktop = window.innerWidth >= 1024;
    const allowInteraction = isExpanded || isDesktop;

    return {
      scrollwheel: allowInteraction,
      gestureHandling: allowInteraction ? "greedy" : "none",
      draggable: allowInteraction,
    };
  }, [isExpanded]);

  const onLoad = useCallback((mapInstance) => setMap(mapInstance), []);
  const onUnmount = useCallback(() => setMap(null), []);

  useEffect(() => {
    if (!isGoogleReady || !map) return;

    if (listing.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      listing.forEach(({ coordinates: coord }) => {
        if (
          coord?.lat &&
          coord?.lng &&
          typeof coord.lat === "number" &&
          typeof coord.lng === "number"
        ) {
          bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng));
        }
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);

        // 👇 Forzar un zoom mínimo si Google ajusta demasiado
        window.google.maps.event.addListenerOnce(map, "idle", () => {
          const currentZoom = map.getZoom();
          if (currentZoom < 3) {
            map.setZoom(3);
          }
        });
      }
    } else if (coordinates?.lat && coordinates?.lng) {
      const newCenter = { lat: coordinates.lat, lng: coordinates.lng };
      const recommendedZoom = 20;

      map.panTo(newCenter);
      setTimeout(() => {
        map.setZoom(recommendedZoom);
      }, 100);
    }
  }, [listing, coordinates, isGoogleReady, map]);

  useEffect(() => {
    if (typeof onExpandChange === "function") {
      onExpandChange(isExpanded);
    }
  }, [isExpanded, onExpandChange]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  const hasValidListings = listing.some(
    (item) =>
      typeof item.coordinates?.lat === "number" &&
      typeof item.coordinates?.lng === "number"
  );

  const selectedStyle =
    mapType === "roadmap"
      ? isDarkMode
        ? darkMapStyle
        : lightMapStyle
      : undefined;

  return (
    <div
      className={`transition-all duration-500 ${
        isExpanded
          ? "fixed bottom-0 left-0 right-0 top-[64px] z-[60] bg-white"
          : "relative h-full w-full"
      }`}
    >
      {isExpanded && (
        <button
          onClick={() => setIsExpanded(false)}
          className="absolute right-4 top-[75px] z-[110] flex h-10 w-10 items-center justify-center rounded-full bg-white text-2xl text-black shadow-lg transition hover:bg-red-500 hover:text-white"
          title="Cerrar expansión"
        >
          ×
        </button>
      )}

      <div
        className={`absolute left-4 ${
          isExpanded ? "top-[100px]" : "top-[14%]"
        } z-20 -translate-y-1/2`}
      >
        <button
          onClick={() =>
            setMapType(mapType === "roadmap" ? "hybrid" : "roadmap")
          }
          aria-label="Cambiar tipo de mapa"
          className="flex items-center justify-center rounded-xl bg-white px-4 py-3 text-primary shadow-lg transition-all duration-200 hover:bg-primary hover:text-white active:scale-95"
          title="Cambiar tipo de mapa"
        >
          <span className="text-xl text-inherit">
            {mapType === "roadmap" ? "🗺️" : "🌐"}
          </span>
        </button>
      </div>

      {map && (
        <div className="absolute bottom-28 right-4 z-20 flex flex-col gap-3">
          <button
            onClick={() => map.setZoom(map.getZoom() + 1)}
            className="h-12 w-12 rounded-full bg-white text-2xl font-bold text-primary shadow-lg transition hover:bg-primary hover:text-white"
            title="Acercar"
          >
            +
          </button>

          <button
            onClick={() => map.setZoom(map.getZoom() - 1)}
            className="h-12 w-12 rounded-full bg-white text-2xl font-bold text-primary shadow-lg transition hover:bg-primary hover:text-white"
            title="Alejar"
          >
            −
          </button>

          {listing.length > 1 && (
            <button
              onClick={() => {
                const bounds = new window.google.maps.LatLngBounds();
                listing.forEach(({ coordinates: coord }) => {
                  if (
                    coord?.lat &&
                    coord?.lng &&
                    typeof coord.lat === "number" &&
                    typeof coord.lng === "number"
                  ) {
                    bounds.extend(
                      new window.google.maps.LatLng(coord.lat, coord.lng)
                    );
                  }
                });

                if (!bounds.isEmpty()) {
                  map.fitBounds(bounds);
                  window.google.maps.event.addListenerOnce(map, "idle", () => {
                    if (map.getZoom() < 3) {
                      map.setZoom(3);
                    }
                  });
                }
              }}
              className="h-12 w-12 rounded-full bg-white text-lg font-bold text-primary shadow-lg transition hover:bg-primary hover:text-white"
              title="Recentrar mapa"
            >
              ⟳
            </button>
          )}

          {!isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="h-12 w-12 rounded-full bg-white text-xl text-primary shadow-lg transition hover:bg-primary hover:text-white"
              title="Expandir mapa"
            >
              ⤢
            </button>
          )}
        </div>
      )}

      <div className="relative h-full w-full">
        {hasValidListings || coordinates?.lat ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            mapTypeId={mapType}
            zoom={listing.length ? undefined : 16}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
              disableDefaultUI: true,
              ...getMapOptions(),
              styles: selectedStyle,
              minZoom: 3, // 👈 mínimo visible
              maxZoom: 18, // 👈 evita zoom exagerado
              restriction: {
                latLngBounds: {
                  north: 85,
                  south: -85,
                  east: 180,
                  west: -180,
                },
                strictBounds: false, // deja panear un poco, pero evita duplicaciones
              },
            }}
          >
            {customMarker ? (
              customMarker
            ) : hasValidListings ? (
              listing.map((item) =>
                item.coordinates?.lat && item.coordinates?.lng ? (
                  <MarkerItem
                    key={item.id}
                    item={item}
                    map={map}
                    isHovered={hoveredListingId === item.id}
                    onHoverChange={setHoveredListingId}
                    isSingleMarker={listing.length === 1}
                  />
                ) : null
              )
            ) : coordinates?.lat ? (
              <MarkerItem
                item={{ coordinates }}
                map={map}
                isHovered={hoveredListingId === "single"}
                onHoverChange={setHoveredListingId}
                isSingleMarker={true}
              />
            ) : null}
          </GoogleMap>
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-100">
            <span className="text-gray-500">No se encontraron propiedades</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default GoogleMapSection;
