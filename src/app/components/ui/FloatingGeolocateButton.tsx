"use client"

import { useCallback } from "react";
import { useMap } from "../context/MapContext";

export default function FloatingGeolocateButton() {
  const { triggerGeolocate } = useMap();

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      triggerGeolocate();
    } catch (err) {
      console.warn('triggerGeolocate not available', err);
    }
  }, [triggerGeolocate]);

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Ubicarme"
      aria-label="Ubicarme"
      className="uc-btn btn-inline floating-geolocate-btn"
    >
      <i
        className="uc-icon icon-shape--rounded"
        style={{
          right: 24,
          bottom: 24,
          display: 'inline-flex',
          width: 48,
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          fontSize: 25,
        }}
      >
        my_location
      </i>

      <style jsx>{`
        .floating-geolocate-btn { /* keep button wrapper but icon handles positioning */
          background: transparent;
          border: none;
          padding: 0;
        }

        .floating-geolocate-btn:focus { outline: none; }
      `}</style>
    </button>
  );
}
