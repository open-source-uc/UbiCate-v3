"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useRouteMapContext } from "../context/RouteMapContext";
import { MAPBOX_STYLE_URL } from '@/themes/mapstyles';
import MapManager from '@/app/lib/mapManager';

const MAPBOX_API_KEY = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;

export default function RouteMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { routeGeojson, placesGeojson } = useRouteMapContext();

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_API_KEY) return;

    // Función para obtener la primera coordenada válida
    function getFirstCoordinate(gj: any): [number, number] | null {
      if (!gj) return null;
      if (gj.type === 'FeatureCollection' && Array.isArray(gj.features) && gj.features.length > 0) {
        for (const feat of gj.features) {
          const coord = getFirstCoordinate(feat);
          if (coord) return coord;
        }
      } else if (gj.type === 'Feature' && gj.geometry) {
        return getFirstCoordinate(gj.geometry);
      } else if (gj.type === 'Point' && Array.isArray(gj.coordinates)) {
        return gj.coordinates;
      } else if (gj.type === 'LineString' && Array.isArray(gj.coordinates) && gj.coordinates.length > 0) {
        return gj.coordinates[0];
      } else if (gj.type === 'Polygon' && Array.isArray(gj.coordinates) && gj.coordinates.length > 0 && Array.isArray(gj.coordinates[0]) && gj.coordinates[0].length > 0) {
        return gj.coordinates[0][0];
      }
      return null;
    }

    const centerCoord = getFirstCoordinate(routeGeojson) || [-70.6106, -33.4378];

    // Si ya hay un mapa, destrúyelo antes de crear uno nuevo
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    try {
      // Verificar que tengamos la API key
      if (!MAPBOX_API_KEY) {
        console.error("Mapbox API key not found");
        return;
      }

      // Configurar token de acceso
      mapboxgl.accessToken = MAPBOX_API_KEY;
      
      // Initialize map
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAPBOX_STYLE_URL,
        center: centerCoord,
        zoom: 16,
      });

      map.current = mapInstance;

      mapInstance.on("load", () => {
        try {
          // Esperar a que el estilo se cargue completamente
          if (!mapInstance.isStyleLoaded()) {
            mapInstance.once("styledata", () => {
              setupMapContent(mapInstance);
            });
            return;
          }
          
          setupMapContent(mapInstance);
        } catch (error) {
          console.error("Error setting up map:", error);
        }
      });

      // Función para configurar el contenido del mapa
      const setupMapContent = (mapInstance: mapboxgl.Map) => {
        try {
          // Verificar que el mapa esté listo
          if (!mapInstance || !mapInstance.isStyleLoaded()) {
            console.warn("Map not ready, skipping content setup");
            return;
          }

          // Dibujar rutas usando MapManager
          if (routeGeojson && routeGeojson.features.length > 0) {
            // Pequeño delay para asegurar que el mapa esté completamente listo
            setTimeout(() => {
              try {
                MapManager.drawRoutes(mapInstance, routeGeojson, {
                  fit: true,
                  showEndpoints: true
                });
              } catch (error) {
                console.error("Error drawing routes:", error);
              }
            }, 100);
          }

          // Dibujar lugares usando MapManager
          if (placesGeojson && placesGeojson.length > 0) {
            setTimeout(() => {
              try {
                // Filtrar lugares válidos y convertir a FeatureCollection
                const validPlaces = placesGeojson.filter(place => 
                  place && 
                  place.type === 'FeatureCollection' && 
                  Array.isArray(place.features) && 
                  place.features.length > 0
                );
                
                if (validPlaces.length > 0) {
                  MapManager.drawPlaces(mapInstance, validPlaces, {
                    mode: "multi",
                    zoom: false, // No hacer zoom a lugares, ya lo hizo la ruta
                    showPolygonLabels: true
                  });
                }
              } catch (error) {
                console.error("Error drawing places:", error);
              }
            }, 200);
          }
        } catch (error) {
          console.error("Error in setupMapContent:", error);
        }
      };

      mapInstance.on("error", (e) => {
        console.error("Mapbox error:", e.error);
      });

      return () => {
        if (map.current) {
          // Limpiar capas de MapManager antes de destruir el mapa
          try {
            // Verificar que el mapa esté inicializado antes de limpiar
            if (map.current.isStyleLoaded && map.current.isStyleLoaded()) {
              (map.current as any).__removeRoutes?.();
              (map.current as any).__removePlacesPolygons?.();
            }
          } catch (error) {
            console.warn("Error cleaning up MapManager layers:", error);
          }
          
          try {
            map.current.remove();
          } catch (error) {
            console.warn("Error removing map:", error);
          }
          
          map.current = null;
        }
      };
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, [routeGeojson, placesGeojson]);

  if (!MAPBOX_API_KEY) {
    return (
      <div style={{
        width: "100%",
        height: "400px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        border: "1px solid #ddd",
        borderRadius: "8px",
        color: "#666"
      }}>
        <div style={{ textAlign: "center" }}>
          <i className="uc-icon" style={{ fontSize: "48px", marginBottom: "16px" }}>map</i>
          <p>Token de Mapbox no configurado</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "400px",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid #e0e0e0"
      }}
    />
  );
}