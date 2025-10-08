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
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Mostrar 10 registros por página en el histórico
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

      // Obtener histórico de la ruta
      try {
        const historicoResponse = await fetch(`/api/routes/historico?id_ruta=${id}`);
        if (historicoResponse.ok) {
          const historicoData = await historicoResponse.json();
          if (historicoData.success) {
            setHistorico(historicoData.data);
          }
        }
      } catch (err) {
        console.error("Error cargando histórico:", err);
        // No bloqueamos la carga de la ruta si falla el histórico
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

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getOperacionColor = (operacion: string) => {
    const colores: Record<string, string> = {
      CREAR: "#10B981",
      ACTUALIZAR: "#3B82F6",
      ELIMINAR: "#EF4444",
      APROBAR: "#059669",
      RECHAZAR: "#F97316"
    };
    return colores[operacion] || "#6B7280";
  };

  const getOperacionIcon = (operacion: string) => {
    const iconos: Record<string, string> = {
      CREAR: "add_circle",
      ACTUALIZAR: "edit",
      ELIMINAR: "delete",
      APROBAR: "check_circle",
      RECHAZAR: "cancel"
    };
    return iconos[operacion] || "info";
  };



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

      {/* Histórico de Cambios */}
      <div style={{ 
        backgroundColor: "#fff", 
        borderRadius: "12px", 
        padding: "2rem",
        marginTop: "2rem",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e0e0e0"
      }}>
        <h3 style={{ color: "#0176DE", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <i className="uc-icon">history</i>
          Histórico de Cambios {historico.length > 0 && `(${historico.length})`}
        </h3>
        
        {historico.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "48px 24px", 
            color: "#6B7280",
            background: "#F9FAFB",
            borderRadius: "8px"
          }}>
            <i className="uc-icon" style={{ fontSize: "48px", color: "#D1D5DB", marginBottom: "12px" }}>history</i>
            <p style={{ margin: 0, fontSize: "16px" }}>No hay cambios registrados para esta ruta</p>
          </div>
        ) : (
          <>
            {/* Tabla de histórico */}
            <div style={{ overflowX: "auto" }}>
              <table className="uc-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ width: "50px", textAlign: "center" }}>Tipo</th>
                    <th style={{ width: "180px" }}>Usuario</th>
                    <th>Mensaje</th>
                    <th style={{ width: "180px" }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const paginatedHistorico = historico.slice(
                      (currentPage - 1) * pageSize,
                      currentPage * pageSize
                    );
                    
                    return (
                      <>
                        {paginatedHistorico.map((item) => (
                          <tr key={item.id_historico_ruta}>
                            {/* Tipo de operación con ícono */}
                            <td style={{ textAlign: "center" }}>
                              <span
                                className="material-icons"
                                style={{
                                  color: getOperacionColor(item.tipo_operacion),
                                  fontSize: "24px",
                                  verticalAlign: "middle"
                                }}
                                title={item.tipo_operacion}
                              >
                                {getOperacionIcon(item.tipo_operacion)}
                              </span>
                            </td>

                            {/* Usuario */}
                            <td>
                              <strong>{item.nombre_usuario}</strong>
                              <br />
                              <small
                                style={{
                                  color: "#6B7280",
                                  fontSize: "12px",
                                  padding: "2px 8px",
                                  background: getOperacionColor(item.tipo_operacion) + "20",
                                  borderRadius: "4px",
                                  display: "inline-block",
                                  marginTop: "4px"
                                }}
                              >
                                {item.tipo_operacion}
                              </small>
                            </td>

                            {/* Mensaje */}
                            <td>{item.mensaje}</td>

                            {/* Fecha */}
                            <td>
                              <span style={{ color: "#6B7280", fontSize: "14px" }}>
                                {formatearFecha(item.fecha)}
                              </span>
                            </td>
                          </tr>
                        ))}
                        
                        {/* Filas vacías para completar la página */}
                        {Array.from({ length: Math.max(0, pageSize - paginatedHistorico.length) }).map((_, index) => (
                          <tr key={`empty-${index}`} style={{ height: "60px" }}>
                            <td colSpan={4} style={{ borderBottom: "1px solid #E5E7EB" }}>&nbsp;</td>
                          </tr>
                        ))}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {Math.ceil(historico.length / pageSize) > 1 && (
              <nav className="uc-pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '24px 0' }}>
                <button
                  className="uc-pagination_prev mr-12"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  aria-label="Anterior"
                >
                  <i className="uc-icon">keyboard_arrow_left</i>
                </button>
                <ul className="uc-pagination_pages" style={{ display: 'flex', alignItems: 'center', gap: '4px', listStyle: 'none', margin: 0, padding: 0 }}>
                  {(() => {
                    const totalPages = Math.ceil(historico.length / pageSize);
                    return (
                      <>
                        {/* Primera página */}
                        <li className={`page-item${currentPage === 1 ? ' active' : ''}`}>
                          <a href="#" className="page-link" onClick={e => { e.preventDefault(); setCurrentPage(1); }}>1</a>
                        </li>
                        
                        {/* Páginas intermedias */}
                        {currentPage > 3 && totalPages > 5 && (
                          <li className="page-item"><a href="#" className="page-link" onClick={e => e.preventDefault()}>...</a></li>
                        )}
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => page !== 1 && page !== totalPages && Math.abs(page - currentPage) <= 1)
                          .map((page, idx) => (
                            <li key={page + '-' + idx} className={`page-item${currentPage === page ? ' active' : ''}`}>
                              <a href="#" className="page-link" onClick={e => { e.preventDefault(); setCurrentPage(page); }}>{page}</a>
                            </li>
                          ))}
                        
                        {currentPage < totalPages - 2 && totalPages > 5 && (
                          <li className="page-item"><a href="#" className="page-link" onClick={e => e.preventDefault()}>...</a></li>
                        )}
                        
                        {/* Última página */}
                        {totalPages > 1 && (
                          <li className={`page-item${currentPage === totalPages ? ' active' : ''}`}>
                            <a href="#" className="page-link" onClick={e => { e.preventDefault(); setCurrentPage(totalPages); }}>{totalPages}</a>
                          </li>
                        )}
                      </>
                    );
                  })()}
                </ul>
                <button
                  className="uc-pagination_next ml-12"
                  disabled={currentPage === Math.ceil(historico.length / pageSize)}
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(historico.length / pageSize), p + 1))}
                  aria-label="Siguiente"
                >
                  <i className="uc-icon">keyboard_arrow_right</i>
                </button>
              </nav>
            )}

            {/* Estadísticas */}
            <div style={{ 
              marginTop: "16px", 
              padding: "12px", 
              background: "#F9FAFB", 
              borderRadius: "8px",
              display: "flex",
              gap: "24px",
              flexWrap: "wrap",
              justifyContent: "center",
              fontSize: "14px",
              color: "#6B7280"
            }}>
              {(() => {
                const stats = {
                  CREAR: historico.filter(h => h.tipo_operacion === 'CREAR').length,
                  ACTUALIZAR: historico.filter(h => h.tipo_operacion === 'ACTUALIZAR').length,
                  ELIMINAR: historico.filter(h => h.tipo_operacion === 'ELIMINAR').length,
                  APROBAR: historico.filter(h => h.tipo_operacion === 'APROBAR').length,
                  RECHAZAR: historico.filter(h => h.tipo_operacion === 'RECHAZAR').length,
                };
                
                return (
                  <>
                    {stats.CREAR > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="material-icons" style={{ fontSize: "16px", color: "#10B981" }}>add_circle</span>
                        <span><strong>{stats.CREAR}</strong> Creación{stats.CREAR !== 1 ? 'es' : ''}</span>
                      </div>
                    )}
                    {stats.ACTUALIZAR > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="material-icons" style={{ fontSize: "16px", color: "#3B82F6" }}>edit</span>
                        <span><strong>{stats.ACTUALIZAR}</strong> Actualización{stats.ACTUALIZAR !== 1 ? 'es' : ''}</span>
                      </div>
                    )}
                    {stats.APROBAR > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="material-icons" style={{ fontSize: "16px", color: "#059669" }}>check_circle</span>
                        <span><strong>{stats.APROBAR}</strong> Aprobación{stats.APROBAR !== 1 ? 'es' : ''}</span>
                      </div>
                    )}
                    {stats.RECHAZAR > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="material-icons" style={{ fontSize: "16px", color: "#F97316" }}>cancel</span>
                        <span><strong>{stats.RECHAZAR}</strong> Rechazo{stats.RECHAZAR !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {stats.ELIMINAR > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="material-icons" style={{ fontSize: "16px", color: "#EF4444" }}>delete</span>
                        <span><strong>{stats.ELIMINAR}</strong> Eliminación{stats.ELIMINAR !== 1 ? 'es' : ''}</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </>
        )}
      </div>

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