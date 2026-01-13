// src/lib/mapStyles/darkPro.js

const darkProMapStyle = [
  /* ======================
     BASE
  ====================== */
  {
    elementType: "geometry",
    stylers: [{ color: "#0f172a" }], // slate-900
  },

  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#e5e7eb" }], // slate-200
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#020617" }, { weight: 2 }],
  },

  /* ======================
     ADMIN
  ====================== */
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [{ visibility: "off" }],
  },

  /* ======================
     POI
  ====================== */
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#111827" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cbd5f5" }],
  },
  {
    featureType: "poi.business",
    stylers: [{ visibility: "off" }],
  },

  /* Parks */
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#052e16" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4ade80" }],
  },

  /* ======================
     ROADS
  ====================== */
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca3af" }],
  },

  /* Highways */
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#7c2d12" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#ea580c" }],
  },

  /* ======================
     TRANSIT
  ====================== */
  {
    featureType: "transit",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#475569" }],
  },

  /* ======================
     WATER
  ====================== */
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: "#020617" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#60a5fa" }],
  },
];

export default darkProMapStyle;
