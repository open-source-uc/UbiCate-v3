'use client';

import type { StepProps } from "@/app/types/stepProps";
import { StepTagAttributes } from "@/app/types/stepTagAttributes";
import { useState, useEffect } from "react";
import type { Place } from "@/app/types/placeType";
import type { RouteWithGeo } from "@/app/types/routeType";
import { marked } from "marked";
import { useSidebar } from "../../context/SidebarContext";
import { useMap } from "../../context/MapContext";

export default function RouteDetailStep({ data }: StepProps) {
  const [route, setRoute] = useState<RouteWithGeo | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const { clearQueryParams } = useSidebar();
  const { setActiveRoute, mapRef } = useMap();

  useEffect(() => {
    if (!data?.routeId) return;
    const rid = String(data.routeId);
    setRoute(null);
    setPlaces([]);
    
    fetch(`/api/routes/${rid}`)
      .then(res => {
        if (!res.ok) throw new Error('No se pudo cargar la ruta');
        return res.json();
      })
      .then(foundRoute => {
        setRoute(foundRoute);

        // Cargar lugares asociados a la ruta
        if (foundRoute.placeIds && foundRoute.placeIds.length > 0) {
          fetch("/api/places/getAll")
            .then(placesRes => placesRes.json())
            .then(placesData => {
              const routePlaces = placesData.filter((place: Place) => 
                foundRoute.placeIds.includes(place.id_lugar)
              );
              setPlaces(routePlaces);
            })
            .catch(err => {
              console.error("Error cargando lugares:", err);
            });
        }
      })
      .catch(() => {
        setRoute(null);
      });
  }, [data?.routeId]);

  if (!route) {
    return <ul {...StepTagAttributes}>cargando…</ul>;
  }

  function handleStepBack() {
    // Limpiar la visualización de la ruta y los lugares en el mapa
    const map = mapRef.current;
    if (map) {
      // Limpiar la ruta
      if ((map as any).__removeRoutes) {
        (map as any).__removeRoutes();
      }
      // Limpiar los lugares/puntos asociados
      if ((map as any).__removePlacesPolygons) {
        (map as any).__removePlacesPolygons();
      }
    }
    
    data?.__removeRoute?.();
    setActiveRoute(null); // Limpiar la ruta activa y ocultar el botón flotante
    clearQueryParams();
  }

  // Función para obtener el estilo del badge de estado
  const getEstadoBadgeStyle = (estadoId: number) => {
    const estilos: Record<number, { bg: string; color: string; border: string; text: string }> = {
      1: { // Rechazado
        bg: "#fee2e2",
        color: "#991b1b",
        border: "#fecaca",
        text: "Rechazada"
      },
      2: { // Aceptado/Aprobado
        bg: "#d4edda",
        color: "#155724",
        border: "#c3e6cb",
        text: "Publicada"
      },
      3: { // En espera/Pendiente
        bg: "#fff3cd",
        color: "#856404",
        border: "#ffeaa7",
        text: "Pendiente"
      }
    };
    return estilos[estadoId] || estilos[3]; // Default a pendiente
  };

  const estadoStyle = getEstadoBadgeStyle(route.estado_ubicacion_geografica || 3);

  return (
    <ul {...StepTagAttributes}>
      <button className="uc-btn btn-featured" onClick={handleStepBack}>
        Volver
        <i className="uc-icon">arrow_back_ios_new</i>
      </button>
      <br />
      
      {/* Título y badges */}
      <h1 style={{ fontSize: "1.5rem", marginTop: "1rem" }}>{route.nombre_ruta}</h1>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
        <span style={{ fontSize: "1.1rem", fontStyle: "italic", color: "#666" }}>
          Campus {route.nombre_campus}
        </span>
        
        <span style={{
          backgroundColor: estadoStyle.bg,
          color: estadoStyle.color,
          padding: "4px 12px",
          borderRadius: "16px",
          fontSize: "0.875rem",
          fontWeight: "500",
          border: `1px solid ${estadoStyle.border}`,
          display: "inline-block",
          width: "fit-content"
        }}>
          {estadoStyle.text}
        </span>
      </div>

      {/* Información básica */}
      <div style={{ marginTop: "1.5rem" }}>
        <h3 style={{ color: "#0176DE", fontSize: "1.1rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "6px" }}>
          <i className="uc-icon" style={{ fontSize: "20px" }}>info</i>
          Información General
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.95rem" }}>
          <div>
            <strong>ID:</strong> {route.id_ruta}
          </div>
          <div>
            <strong>Lugares en ruta:</strong>{" "}
            <span style={{ 
              backgroundColor: "#e8f4fd", 
              color: "#0176DE", 
              padding: "2px 10px", 
              borderRadius: "12px", 
              fontSize: "0.875rem",
              fontWeight: "500"
            }}>
              {route.placeIds?.length || 0} lugares
            </span>
          </div>
          {route.color_icono && route.icono && (
            <div>
              <strong>Apariencia:</strong>{" "}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <i className="uc-icon" style={{ 
                    color: route.color_icono || "#0176DE", 
                    fontSize: "20px" 
                  }}>
                    {route.icono || "route"}
                  </i>
                  <span style={{ fontSize: "0.875rem", color: "#666" }}>
                    {route.icono || "route"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{
                    width: "20px",
                    height: "20px",
                    backgroundColor: route.color_icono || "#0176DE",
                    borderRadius: "4px",
                    border: "1px solid #ddd"
                  }}></div>
                  <span style={{ fontSize: "0.875rem", color: "#666" }}>
                    {route.color_icono || "#0176DE"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Descripción */}
      {route.descripcion && (
        <div style={{ marginTop: "1.5rem" }}>
          <h3 style={{ color: "#0176DE", fontSize: "1.1rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="uc-icon" style={{ fontSize: "20px" }}>description</i>
            Descripción
          </h3>
          <div 
            style={{ 
              backgroundColor: "#f8f9fa", 
              padding: "12px", 
              borderRadius: "8px",
              border: "1px solid #e9ecef",
              fontSize: "0.95rem"
            }}
            dangerouslySetInnerHTML={{ __html: marked(route.descripcion) }}
          />
        </div>
      )}

      {/* Lugares en la ruta */}
      {places.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <h3 style={{ color: "#0176DE", fontSize: "1.1rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="uc-icon" style={{ fontSize: "20px" }}>place</i>
            Lugares en la Ruta ({places.length})
          </h3>
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "8px",
            backgroundColor: "#f8f9fa",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #e9ecef"
          }}>
            {places.map((place) => (
              <div 
                key={place.id_lugar}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px",
                  backgroundColor: "#fff",
                  borderRadius: "6px",
                  border: "1px solid #e0e0e0"
                }}
              >
                {place.icono && (
                  <i className="uc-icon" style={{ 
                    color: place.color_icono || "#0176DE", 
                    fontSize: "20px",
                    flexShrink: 0
                  }}>
                    {place.icono}
                  </i>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: "500", fontSize: "0.95rem" }}>
                    {place.nombre_lugar}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#666" }}>
                    {place.nombre_tipo_lugar}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensaje si no hay lugares */}
      {places.length === 0 && route.placeIds && route.placeIds.length === 0 && (
        <div style={{ 
          marginTop: "1.5rem",
          textAlign: "center", 
          padding: "24px", 
          color: "#6B7280",
          background: "#F9FAFB",
          borderRadius: "8px",
          border: "1px solid #e9ecef"
        }}>
          <i className="uc-icon" style={{ fontSize: "36px", color: "#D1D5DB", marginBottom: "8px" }}>place</i>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>Sin lugares asociados</p>
        </div>
      )}

      {/* Estilos PhotoSwipe (aunque no hay galería, los incluimos por consistencia) */}
      <style jsx>{`
        /* Markdown content styling */
        ul :global(h1),
        ul :global(h2),
        ul :global(h3) {
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          color: #374151;
          font-size: 1.1rem;
        }

        ul :global(p) {
          margin: 0.5rem 0;
        }

        ul :global(ul),
        ul :global(ol) {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        ul :global(a) {
          color: #0176DE;
          text-decoration: underline;
        }

        ul :global(code) {
          background: #e9ecef;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.875rem;
        }

        ul :global(pre) {
          background: #f8f9fa;
          padding: 0.75rem;
          border-radius: 8px;
          overflow-x: auto;
          font-size: 0.875rem;
        }

        ul :global(blockquote) {
          border-left: 4px solid #0176DE;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #6B7280;
        }
      `}</style>
    </ul>
  );
}
