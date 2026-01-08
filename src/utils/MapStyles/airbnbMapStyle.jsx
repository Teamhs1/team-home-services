const airbnbMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#fefefe" }] },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#1f2937" }], // texto más oscuro para mejor contraste
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }, { weight: 2 }],
  },

  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#d1d5db" }],
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.business",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#e5f4f9" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#e4e7eb" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#374151" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#bbf7d0" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#15803d" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#d1d5db" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#f3f4f6" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#facc15" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#eab308" }],
  },
  {
    featureType: "road.highway.controlled_access",
    elementType: "geometry",
    stylers: [{ color: "#fb923c" }],
  },
  {
    featureType: "road.highway.controlled_access",
    elementType: "geometry.stroke",
    stylers: [{ color: "#c2410c" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4b5563" }],
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#cbd5e1" }],
  },
  {
    featureType: "transit.line",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b7280" }],
  },
  {
    featureType: "transit.line",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [{ color: "#e2e8f0" }],
  },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: "#c7d2fe" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#1e3a8a" }],
  },
];

export default airbnbMapStyle;
