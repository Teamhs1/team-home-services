// src/lib/mapStyles/airbnbPro.js

const airbnbProMapStyle = [
  /* ======================
     BASE
  ====================== */
  {
    elementType: "geometry",
    stylers: [{ color: "#f9fafb" }],
  },

  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#374151" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }, { weight: 2 }],
  },

  /* ======================
     ADMIN
  ====================== */
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e5e7eb" }],
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
    stylers: [{ color: "#eef2f7" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4b5563" }],
  },
  {
    featureType: "poi.business",
    stylers: [{ visibility: "off" }],
  },

  /* Parks */
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#d1fae5" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#047857" }],
  },

  /* ======================
     ROADS
  ====================== */
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#e5e7eb" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#f3f4f6" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b7280" }],
  },

  /* Highways (más suaves, menos amarillo) */
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#fde68a" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#f59e0b" }],
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
    stylers: [{ color: "#d1d5db" }],
  },

  /* ======================
     WATER
  ====================== */
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: "#e0e7ff" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#1e40af" }],
  },
];

export default airbnbProMapStyle;
