"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMap } from "./MapContext";
import { MapManager } from "@/app/lib/mapManager";
import LoadingModal from "../ui/LoadingModal";

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
  const [loadingShared, setLoadingShared] = useState(false);
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
      setLoadingShared(true);
      let campusRetries = 0;
      const waitForCampusData = () => {
        if (campusData.length === 0 && campusRetries < 30) {
          campusRetries++;
          setTimeout(waitForCampusData, 100);
          return;
        }
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
                if (place.featureCollection) {
                  MapManager.drawSharedPlace(map, {
                    id_lugar: place.id_lugar,
                    nombre_lugar: place.nombre_lugar,
                    id_tipo_lugar: place.id_tipo_lugar,
                    featureCollection: place.featureCollection
                  }, { zoom: false });
                }
                const payload = {
                  placeId: String(place.id_lugar),
                  properties: { ...place },
                  geometryType: place.nombre_tipo_geojson || "Point",
                };
                window.dispatchEvent(new CustomEvent("place:open-in-sidebar", { detail: payload }));
                if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 768px)").matches) {
                  window.dispatchEvent(new Event("sidebar:close"));
                }
              };
              drawPlace();
            }
            setLoadingShared(false);
          })
          .catch(err => {
            setLoadingShared(false);
            console.error("Error loading shared place:", err);
          });
      };
      waitForCampusData();
      return;
    }

    if (!campus && !menu) return setStep("MainStep");
    if (menu && menu !== "PlacesStep") setStep(menu);

    // Handle routeId parameter (from shared links with menu=RouteDetailStep)
    const routeId = params.get("routeId");
    if (routeId && !isNaN(Number(routeId)) && menu === "RouteDetailStep") {
      setLoadingShared(true);
      let campusRetries = 0;
      const waitForCampusData = () => {
        if (campusData.length === 0 && campusRetries < 30) {
          campusRetries++;
          setTimeout(waitForCampusData, 100);
          return;
        }
        fetch(`/api/routes/${routeId}`)
          .then(res => {
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
          })
          .then(route => {
            if (route && route.id_ruta && mapRef.current) {
              const map = mapRef.current;
              const drawRoute = () => {
                if (route.featureCollection) {
                  MapManager.drawSharedRoute(map, {
                    id_ruta: route.id_ruta,
                    nombre_ruta: route.nombre_ruta,
                    featureCollection: route.featureCollection,
                    placeIds: route.placeIds
                  }, { zoom: false, showEndpoints: true });
                }
                setTimeout(() => {
                  if (route.placeIds && route.placeIds.length > 0) {
                    import("@/utils/MapUtils").then(({ default: MapUtils }) => {
                      MapUtils.initPlaceIcons().then(() => {
                        fetch("/api/places/getAll")
                          .then(placesRes => placesRes.json())
                          .then(placesData => {
                            const routePlaces = placesData.filter((place: any) => 
                              route.placeIds.includes(place.id_lugar)
                            );
                            if (routePlaces.length > 0) {
                              const toFC = (g: any): any =>
                                !g ? { type: "FeatureCollection", features: [] }
                                : g.type === "FeatureCollection" ? g
                                : g.type === "Feature" ? { type: "FeatureCollection", features: [g] }
                                : Array.isArray(g) ? { type: "FeatureCollection", features: g }
                                : { type: "FeatureCollection", features: [] };
                              const placesFC: any[] = routePlaces.map((p: any) => {
                                const fc = toFC(p.featureCollection ?? p.geojson);
                                fc.features = fc.features.map((f: any) => ({
                                  ...f,
                                  properties: {
                                    ...(f.properties ?? {}),
                                    placeId: p.id_lugar,
                                    placeTypeId: p.id_tipo_lugar,
                                    placeName: p.nombre_lugar,
                                  },
                                }));
                                return fc;
                              });
                              MapManager.drawPlaces(map, placesFC, { mode: "multi" });
                            }
                          })
                          .catch(err => console.error("Error loading route places:", err));
                      }).catch(err => console.error("Error initializing place icons:", err));
                    });
                  }
                }, 500);
                const payload = {
                  routeId: String(route.id_ruta),
                  properties: { ...route },
                };
                window.dispatchEvent(new CustomEvent("route:open-in-sidebar", { detail: payload }));
                if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 768px)").matches) {
                  window.dispatchEvent(new Event("sidebar:close"));
                }
              };
              drawRoute();
            }
            setLoadingShared(false);
          })
          .catch(err => {
            setLoadingShared(false);
            console.error("Error loading shared route:", err);
          });
      };
      waitForCampusData();
      return;
    }

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
      <LoadingModal open={loadingShared} text="Cargando recurso compartido..." />
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
