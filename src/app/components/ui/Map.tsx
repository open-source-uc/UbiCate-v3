'use client';

import { useMap } from "../context/MapContext";
import FloatingGeolocateButton from "./FloatingGeolocateButton";
import HelpModal from "./HelpModal";

export default function Map() {
  const { mapContainer } = useMap();

  return (
    <div className="uc-hero map-fit relative">
      <div ref={mapContainer} className="map-container" />

      {/* Botones flotantes en viewport, no en el layout */}
      <div className="botones-flotantes">
        <FloatingGeolocateButton />
        <HelpModal />
      </div>
    </div>
  );
}
