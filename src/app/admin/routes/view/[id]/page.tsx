"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { RouteWithGeo } from "@/app/types/routeType";
import { Place } from "@/app/types/placeType";
import tippy, { Instance } from "tippy.js";
import "tippy.js/dist/tippy.css";
import { marked } from "marked";
import { RouteMapProvider } from "@/app/components/context/RouteMapContext";
import RouteMap from "@/app/components/ui/RouteMap";
import MapUtils from "@/utils/MapUtils";
import type { Feature } from "geojson";
import AdminPageContainer from "../../../../components/ui/admin/AdminPageContainer";

export default function ViewRoutePage() {
  const [route, setRoute] = useState<RouteWithGeo | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  const fetchRouteDetails = useCallback(async () => {
    if (!id) {
      setError("Invalid route ID");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const routeResponse = await fetch(`/api/routes/${id}`);
      if (!routeResponse.ok) {
        if (routeResponse.status === 404) {
          setError("Ruta no encontrada");
        } else {
          setError("Error al cargar la ruta");
        }
        setLoading(false);
        return;
      }
      const foundRoute = await routeResponse.json();

      // Assign color and icon from database or use MapUtils as fallback
      foundRoute.color = foundRoute.color_icono || MapUtils.routeIdToColor(foundRoute.id_ruta.toString());
      foundRoute.icon = foundRoute.icono || MapUtils.routeIdToIcon(foundRoute.id_ruta);

      // Apply color to the route's GeoJSON features
      if (foundRoute.featureCollection) {
        foundRoute.featureCollection.features = foundRoute.featureCollection.features.map((feature: Feature) => {
          return {
            ...feature,
            properties: {
              ...feature.properties,
              stroke: foundRoute.color, // Add stroke color for the route line
              "stroke-width": 4,        // Ensure the line is visible
              "stroke-opacity": 0.8,    // Make it slightly transparent
            },
          };
        });
      }

      setRoute(foundRoute);

      if (foundRoute.placeIds && foundRoute.placeIds.length > 0) {
        const placesResponse = await fetch("/api/places/getAll");
        if (!placesResponse.ok) throw new Error("Failed to fetch places");
        const placesData = await placesResponse.json();

        const routePlaces = placesData.filter((place: Place) => 
          foundRoute.placeIds.includes(place.id_lugar)
        );
        setPlaces(routePlaces);
      }
    } catch (error) {
      console.error("Error al cargar detalles de la ruta:", error);
      setError("Error al cargar los datos de la ruta");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setError("Invalid route ID");
      setLoading(false);
      return;
    }

    fetchRouteDetails();
  }, [fetchRouteDetails, id]);

  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    const trigger = isTouch ? "click" : "mouseenter focus";

    const instances: Instance[] = tippy(".uc-tooltip", {
      content: (ref) => ref?.getAttribute("data-tippy-content") || "",
      theme: "uc",
      trigger,
      placement: "top",
      arrow: true,
      hideOnClick: true,
      touch: true,
      appendTo: () => document.body,
      zIndex: 2147483647,
      interactive: false,
      delay: [50, 50],
    });

    return () => instances.forEach((i) => i.destroy());
  }, [loading]);



  if (loading) return <div>Cargando detalles de la ruta...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!route) return <div>Ruta no encontrada</div>;

  const actionButtons = (
    <div style={{ display: "flex", gap: "8px" }}>
      <button
        onClick={() => router.push(`/admin/routes/editar/${route.id_ruta}`)}
        style={{ 
          background: "none",
          border: "none",
          padding: "8px",
          cursor: "pointer",
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        title="Editar ruta"
      >
        <i className="uc-icon" style={{ fontSize: "22px", color: "#0176DE" }}>edit</i>
      </button>
      <button
        onClick={() => router.back()}
        style={{ 
          background: "none",
          border: "none",
          padding: "8px",
          cursor: "pointer",
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        title="Volver"
      >
        <i className="uc-icon" style={{ fontSize: "22px", color: "#F24F4F" }}>close</i>
      </button>
    </div>
  );

  return (
    <AdminPageContainer title="Detalles de la Ruta" actionButton={actionButtons}>
      <div className="route-view-container">
        {/* Route Information Card */}
      <div className="route-info-card">
        <div className="route-info-grid">
          {/* Basic Info */}
          <div>
            <h3 style={{ color: "#0176DE", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="uc-icon">route</i>
              Información General
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <strong>ID:</strong> {route.id_ruta}
              </div>
              <div>
                <strong>Nombre:</strong> {route.nombre_ruta}
              </div>
              <div>
                <strong>Estado:</strong>{" "}
                <span style={{
                  backgroundColor: route.estado_ubicacion_geografica === 2 ? "#d4edda" : "#fff3cd",
                  color: route.estado_ubicacion_geografica === 2 ? "#155724" : "#856404",
                  padding: "4px 12px",
                  borderRadius: "16px",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  border: `1px solid ${route.estado_ubicacion_geografica === 2 ? "#c3e6cb" : "#ffeaa7"}`
                }}>
                  {route.estado_ubicacion_geografica === 2 ? "Publicada" : "En construcción"}
                </span>
              </div>
              <div>
                <strong>Campus:</strong> {route.nombre_campus}
              </div>
              <div>
                <strong>Lugares en ruta:</strong>{" "}
                <span style={{ 
                  backgroundColor: "#e8f4fd", 
                  color: "#0176DE", 
                  padding: "4px 12px", 
                  borderRadius: "16px", 
                  fontSize: "0.875rem",
                  fontWeight: "500"
                }}>
                  {route.placeIds?.length || 0} lugares
                </span>
              </div>
              <div>
                <strong>Apariencia:</strong>{" "}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <i className="uc-icon" style={{ 
                      color: route.color || "#0176DE", 
                      fontSize: "20px" 
                    }}>
                      {route.icon || "route"}
                    </i>
                    <span style={{ fontSize: "0.9rem", color: "#666" }}>
                      {route.icon || "route"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{
                      width: "20px",
                      height: "20px",
                      backgroundColor: route.color || "#0176DE",
                      borderRadius: "4px",
                      border: "1px solid #ddd"
                    }}></div>
                    <span style={{ fontSize: "0.9rem", color: "#666" }}>
                      {route.color || "#0176DE"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 style={{ color: "#0176DE", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="uc-icon">description</i>
              Descripción
            </h3>
            <div style={{ 
              backgroundColor: "#f8f9fa", 
              padding: "1rem", 
              borderRadius: "8px",
              border: "1px solid #e9ecef",
              height: "200px",
              overflowY: "auto"
            }}>
              {route.descripcion ? (
                <div 
                  className="markdown-preview"
                  dangerouslySetInnerHTML={{ __html: marked(route.descripcion) }}
                  style={{
                    lineHeight: "1.6"
                  }}
                />
              ) : (
                <span style={{ color: "#666", fontStyle: "italic" }}>
                  Sin descripción disponible
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Route Map */}
      <div className="route-info-card">
        <h3 style={{ color: "#0176DE", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <i className="uc-icon">map</i>
          Mapa de la Ruta
        </h3>
        {route.featureCollection && route.featureCollection.features.length > 0 ? (
          (() => {
            // El API devuelve 'featureCollection' no 'geojson'
            const placesGeojsonRaw = places.map(place => (place as any).featureCollection || place.geojson).filter(Boolean);
            
            // Enriquecer las features con información de íconos
            const placesGeojson = placesGeojsonRaw.map((geojson, index) => {
              const place = places[index];
              if (!geojson || !geojson.features) return geojson;
              
              return {
                ...geojson,
                features: geojson.features.map((feature: any) => ({
                  ...feature,
                  properties: {
                    ...feature.properties,
                    placeTypeId: place.id_tipo_lugar,
                    placeName: place.nombre_lugar,
                    placeIcon: place.icono,
                    placeColor: place.color_icono,
                    placeType: place.nombre_tipo_lugar
                  }
                }))
              };
            });
            

            return (
              <RouteMapProvider 
                routeGeojson={route.featureCollection} // Pass the updated GeoJSON with stroke color
                placesGeojson={placesGeojson}
              >
                <RouteMap />
              </RouteMapProvider>
            );
          })()
        ) : (
          <div style={{
            width: "100%",
            height: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f8f9fa",
            border: "1px solid #e9ecef",
            borderRadius: "8px",
            color: "#666"
          }}>
            <div style={{ textAlign: "center" }}>
              <i className="uc-icon" style={{ fontSize: "48px", marginBottom: "16px", display: "block" }}>route_off</i>
              <p style={{ margin: "0 0 8px 0", fontWeight: "500" }}>Sin datos geográficos</p>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>Esta ruta no tiene información de ubicación para mostrar en el mapa</p>
            </div>
          </div>
        )}
      </div>

      {/* Places in Route */}
      {places.length > 0 && (
        <div style={{ 
          backgroundColor: "#fff", 
          borderRadius: "12px", 
          padding: "2rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e0e0e0"
        }}>
          <h3 style={{ color: "#0176DE", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="uc-icon">place</i>
            Lugares en la Ruta ({places.length})
          </h3>
          
          <div className="results-table">
            <table className="uc-table" style={{ width: "100%", marginBottom: "24px" }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Campus</th>
                </tr>
              </thead>
              <tbody>
                {places.map((place, index) => (
                  <tr key={place.id_lugar} className={index % 2 === 0 ? "active" : ""}>
                    <td>{place.id_lugar}</td>
                    <td>
                      <strong>{place.nombre_lugar}</strong>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {place.icono && (
                          <i className="uc-icon" style={{ color: place.color_icono || "#0176DE", fontSize: "18px" }}>
                            {place.icono}
                          </i>
                        )}
                        {place.nombre_tipo_lugar}
                      </div>
                    </td>
                    <td>{place.nombre_campus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No places message */}
      {places.length === 0 && (
        <div style={{ 
          backgroundColor: "#fff", 
          borderRadius: "12px", 
          padding: "2rem",
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e0e0e0"
        }}>
          <i className="uc-icon" style={{ fontSize: "48px", color: "#ccc", marginBottom: "16px" }}>place</i>
          <h3 style={{ color: "#666", marginBottom: "8px" }}>Sin lugares asociados</h3>
          <p style={{ color: "#999", margin: 0 }}>Esta ruta no tiene lugares asociados actualmente.</p>
        </div>
      )}

      <style jsx>{`
        .results-table {
          width: 100%;
          display: block;
        }

        .results-table tbody tr {
          height: 60px;
        }

        .results-table tbody tr td {
          vertical-align: middle;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }

        th, td {
          padding: 0.75rem;
          text-align: left;
          border: 1px solid #e0e0e0;
        }

        th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #495057;
        }

        .route-view-container {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .route-info-card {
          background-color: #fff;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 1px solid #e0e0e0;
        }

        .route-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        @media (max-width: 768px) {
          .route-view-container {
            padding: 16px;
          }
          
          .route-info-card {
            padding: 1.5rem;
            margin-bottom: 1.5rem;
          }
          
          .route-info-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          
          .results-table {
            overflow-x: auto;
            max-height: calc(100vh - 150px);
            overflow-y: auto;
          }
        }

        @media (max-width: 480px) {
          .route-view-container {
            padding: 12px;
          }
          
          .route-info-card {
            padding: 1rem;
            margin-bottom: 1rem;
            border-radius: 8px;
          }
          
          .route-info-grid {
            gap: 1rem;
          }
        }
      `}</style>
      </div>
    </AdminPageContainer>
  );
}