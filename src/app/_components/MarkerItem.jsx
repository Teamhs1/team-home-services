"use client";

import { MarkerF, OverlayView, Circle } from "@react-google-maps/api";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import MarkerListingItem from "./MarkerListingItem";

function MarkerItem({
  item,
  isHovered,
  onHoverChange,
  map,
  isSingleMarker = false,
}) {
  const router = useRouter();
  const [internalHover, setInternalHover] = useState(false);
  const [zoom, setZoom] = useState(16);
  const overlayRef = useRef(null);
  const markerRef = useRef(null);
  const bounceTimeoutRef = useRef(null);
  const hasBouncedRef = useRef(false);

  const PRIMARY_COLOR = "#7f57f1";
  const HIGHLIGHT_COLOR = "#facc15";
  const showOverlay = isHovered || internalHover;

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("zoom_changed", () => {
      const z = map.getZoom();
      if (typeof z === "number") setZoom(z);
    });

    const initialZoom = map.getZoom();
    if (typeof initialZoom === "number") setZoom(initialZoom);

    return () => {
      if (listener?.remove) listener.remove();
    };
  }, [map]);

  const circleRadius = useMemo(() => {
    const baseRadius = 100;
    return baseRadius * Math.pow(2, 16 - zoom);
  }, [zoom]);

  const icon = useMemo(() => {
    if (typeof window === "undefined" || !window.google?.maps) return null;

    const color = isHovered ? HIGHLIGHT_COLOR : PRIMARY_COLOR;
    const scale = isHovered ? 1.25 : 1;

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="${40 * scale}" height="${
        40 * scale
      }" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
        </svg>
      `)}`,
      scaledSize: new window.google.maps.Size(40 * scale, 40 * scale),
      anchor: new window.google.maps.Point(20 * scale, 40 * scale),
    };
  }, [isHovered]);

  useEffect(() => {
    if (markerRef.current && window?.google?.maps?.Animation) {
      if (isHovered && !hasBouncedRef.current) {
        markerRef.current.setAnimation(window.google.maps.Animation.BOUNCE);
        hasBouncedRef.current = true;

        bounceTimeoutRef.current = setTimeout(() => {
          markerRef.current?.setAnimation(null);
        }, 2100);
      }

      if (!isHovered && hasBouncedRef.current) {
        markerRef.current.setAnimation(null);
        clearTimeout(bounceTimeoutRef.current);
        hasBouncedRef.current = false;
      }
    }

    return () => clearTimeout(bounceTimeoutRef.current);
  }, [isHovered]);

  const handleMouseOut = (e) => {
    const related = e?.domEvent?.relatedTarget;
    if (overlayRef.current && overlayRef.current.contains(related)) return;
    setTimeout(() => setInternalHover(false), 150);
    onHoverChange?.(null);
  };

  if (!item.coordinates?.lat || !item.coordinates?.lng || !icon) return null;

  return (
    <>
      <MarkerF
        position={item.coordinates}
        icon={icon}
        onLoad={(markerInstance) => {
          markerRef.current = markerInstance;
        }}
        onMouseOver={() => {
          setInternalHover(true);
          onHoverChange?.(item.id);
        }}
        onMouseOut={handleMouseOut}
        onClick={() => router.push(`/view-listing/${item.id}`)}
      />

      {isSingleMarker && (
        <Circle
          center={item.coordinates}
          radius={circleRadius}
          options={{
            strokeColor: PRIMARY_COLOR,
            strokeOpacity: 0.3,
            strokeWeight: 1,
            fillColor: PRIMARY_COLOR,
            fillOpacity: 0.15,
            clickable: false,
            draggable: false,
            editable: false,
            visible: true,
            zIndex: 1,
          }}
        />
      )}

      {showOverlay &&
        item.bedroom &&
        item.bathroom &&
        item.propertyType &&
        item.type && (
          <OverlayView
            position={item.coordinates}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div
              ref={overlayRef}
              onMouseEnter={() => setInternalHover(true)}
              onMouseLeave={() => setInternalHover(false)}
            >
              <MarkerListingItem
                item={item}
                closeHandler={() => setInternalHover(false)}
              />
            </div>
          </OverlayView>
        )}
    </>
  );
}

export default MarkerItem;
