"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMap } from "./MapContext";
import { MapManager } from "@/app/lib/mapManager";

interface SidebarContextProps {
  isOpen: boolean;
  step: string;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  setQueryParam: (name: string, value: string) => void;
  clearQueryParams: () => void;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [step, setStep] = useState("MainStep");
  const { flyToCampus, campusData, mapRef } = useMap();

  const router = useRouter();
  const pathname = usePathname();

  // manejamos los params manualmente
  const [params, setParams] = useState<URLSearchParams>(
    () => (typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams())
  );

  // cada vez que cambia la ruta/URL, actualizamos el estado
  useEffect(() => {
    const update = () => setParams(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);

  const toggleSidebar = () => setIsOpen((prev) => !prev);
  const openSidebar = () => {
    window.dispatchEvent(new Event("sidebar:open"));
  }
  const closeSidebar = () => {
    window.dispatchEvent(new Event("sidebar:close"));
  };

  const clearQueryParams = () => {
    router.replace(pathname);
    setParams(new URLSearchParams());
  };

  function setQueryParam(name: string, value: string, clear: boolean = true) {
    const next = new URLSearchParams(clear ? "" : params.toString());
    next.set(name, value);
    router.push(`${pathname}?${next.toString()}`);
    setParams(next);
  }

  useEffect(() => {
    const campus = params.get("campus");
    const menu = params.get("menu");
    const placeId = params.get("placeId");

    // Handle placeId parameter (from shared links with menu=PlaceDetailStep)
    if (placeId && !isNaN(Number(placeId)) && menu === "PlaceDetailStep") {
      // Fetch place data and open it in sidebar
      fetch(`/api/places/${placeId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(place => {
          if (place && place.id_lugar && mapRef.current) {
            const map = mapRef.current;
            
            // Draw the place on the map using MapManager
            if (place.featureCollection) {
              // Enrich features with required properties for interaction
              const enrichedFC = {
                ...place.featureCollection,
                features: place.featureCollection.features.map((f: any) => ({
                  ...f,
                  id: place.id_lugar,
                  properties: {
                    ...(f.properties || {}),
                    placeId: place.id_lugar,
                    placeName: place.nombre_lugar,
                    placeTypeId: place.id_tipo_lugar,
                    campusId: place.id_campus,
                    ...place // Include all place data
                  }
                }))
              };
              
              MapManager.drawPlaces(map, enrichedFC, { mode: "single", zoom: true });
            }
            
            // The API already returns the place with featureCollection
            // Dispatch event to open place in sidebar (same as clicking on map)
            const payload = {
              placeId: String(place.id_lugar),
              properties: { ...place },
              geometryType: place.nombre_tipo_geojson || "Point",
            };
            
            window.dispatchEvent(new CustomEvent("place:open-in-sidebar", { detail: payload }));
            window.dispatchEvent(new Event("sidebar:open"));
          }
        })
        .catch(err => console.error("Error loading shared place:", err));
      return;
    }

    if (!campus && !menu) return setStep("MainStep");
    if (menu && menu !== "PlacesStep") setStep(menu);

    if (campus && !isNaN(Number(campus))) {
      if (!campusData.find((_campus) => _campus.id_campus == Number(campus))) return setStep("MainStep");
      flyToCampus(Number(campus));
      setStep("PlacesStep");
    }
  }, [params, campusData, flyToCampus, mapRef]);

  return (
    <SidebarContext.Provider
      value={{ isOpen, toggleSidebar, openSidebar, closeSidebar, setQueryParam, step, clearQueryParams }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};
