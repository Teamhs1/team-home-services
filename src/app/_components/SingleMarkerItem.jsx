"use client";

import { MarkerF, Circle } from "@react-google-maps/api";
import React, { useRef, useEffect, useMemo, useState } from "react";

function SingleMarkerItem({ coordinates, map }) {
  const markerRef = useRef(null);
  const [zoom, setZoom] = useState(null);
  const PRIMARY_COLOR = "#7f57f1";

  useEffect(() => {
    if (!map) return;

    const currentZoom = map.getZoom();
    if (typeof currentZoom === "number") setZoom(currentZoom);

    const listener = map.addListener("zoom_changed", () => {
      const newZoom = map.getZoom();
      if (typeof newZoom === "number") setZoom(newZoom);
    });

    return () => {
      if (listener?.remove) listener.remove();
    };
  }, [map]);

  const circleRadius = useMemo(() => {
    const baseRadius = 100;
    return zoom ? baseRadius * Math.pow(2, 16 - zoom) : 0;
  }, [zoom]);

  const icon = useMemo(() => {
    if (typeof window === "undefined" || !window.google?.maps) return null;

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="40" height="40" viewBox="0 0 24 24" fill="${PRIMARY_COLOR}" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
        </svg>
      `)}`,
      scaledSize: new window.google.maps.Size(40, 40),
      anchor: new window.google.maps.Point(20, 40),
    };
  }, []);

  if (!icon) return null;

  return (
    <>
      <MarkerF
        position={coordinates}
        icon={icon}
        onLoad={(instance) => (markerRef.current = instance)}
      />

      {zoom >= 17 && (
        <Circle
          center={coordinates}
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
    </>
  );
}

export default SingleMarkerItem;
