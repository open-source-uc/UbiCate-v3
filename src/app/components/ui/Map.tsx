// components/Map.tsx
'use client';

import { useMap } from "../context/MapContext";

export default function Map() {
  const { mapContainer } = useMap();

  return (
    <div className="uc-hero map-fit">
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}
