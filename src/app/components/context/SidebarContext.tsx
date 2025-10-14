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

  // Close sidebar on mobile when emergency location is shared
  useEffect(() => {
    const hasEmergencyParams = params.has("lat") && params.has("lng");
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    
    if (hasEmergencyParams && isMobile) {
      setIsOpen(false);
      // Dispatch the close event for mobile sidebar
      window.dispatchEvent(new Event("sidebar:close"));
    }
  }, [params]);

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
      // Esperar a que campusData esté cargado
      let campusRetries = 0;
      const waitForCampusData = () => {
        if (campusData.length === 0 && campusRetries < 30) {
          campusRetries++;
          setTimeout(waitForCampusData, 100);
          return;
        }
        // Fetch place data y abrir en sidebar
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
              const drawPlace = () => {
                // Draw the place on the map using the dedicated shared place function
                if (place.featureCollection) {
                  MapManager.drawSharedPlace(map, {
                    id_lugar: place.id_lugar,
                    nombre_lugar: place.nombre_lugar,
                    id_tipo_lugar: place.id_tipo_lugar,
                    featureCollection: place.featureCollection
                  }, { zoom: true });
                }
                // Dispatch event to prepare place data for sidebar
                const payload = {
                  placeId: String(place.id_lugar),
                  properties: { ...place },
                  geometryType: place.nombre_tipo_geojson || "Point",
                };
                window.dispatchEvent(new CustomEvent("place:open-in-sidebar", { detail: payload }));
                // Si es móvil, forzar el cierre del sidebar para que nunca se abra automáticamente
                if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 768px)").matches) {
                  window.dispatchEvent(new Event("sidebar:close"));
                }
              };
              // Si el campus del lugar no está en campusData o no es el actual, esperar a que esté activo
              const campusId = place.id_campus;
              const currentCampusId = campusData.find(c => c.id_campus === campusId);
              if (!currentCampusId) {
                flyToCampus(campusId);
                // Esperar a que el campus esté activo antes de dibujar el punto
                let retries = 0;
                const waitForCampus = () => {
                  const active = campusData.find(c => c.id_campus === campusId);
                  if (active && mapRef.current) {
                    setTimeout(drawPlace, 350); // pequeño delay para asegurar que el mapa terminó el fitBounds
                  } else if (retries < 15) {
                    retries++;
                    setTimeout(waitForCampus, 100);
                  } else {
                    // Si no carga, igual intentamos dibujar
                    drawPlace();
                  }
                };
                waitForCampus();
              } else {
                drawPlace();
              }
            }
          })
          .catch(err => console.error("Error loading shared place:", err));
      };
      waitForCampusData();
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
