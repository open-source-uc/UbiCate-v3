"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { RouteWithGeo } from "@/app/types/routeType";
import { Place } from "@/app/types/placeType";
import tippy, { Instance } from "tippy.js";
import "tippy.js/dist/tippy.css";
import { marked } from "marked";
import { RouteMapProvider } from "@/app/components/context/RouteMapContext";
import RouteMap from "@/app/components/ui/RouteMap";
import type { Feature } from "geojson";
import MapUtils from "@/utils/MapUtils";

type Campus = {
  id_campus: number;
  nombre_campus: string;
};

export default function EditarRutaPage() {
  const [route, setRoute] = useState<RouteWithGeo | null>(null);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    nombre_ruta: "",
    descripcion: "",
    id_campus: 0
  });

  const params = useParams();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const id = params?.id as string | undefined;

  const fetchData = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Fetch route data
      const routeResponse = await fetch("/api/getRoutes");
      const routesData = await routeResponse.json();
      const foundRoute = routesData.find((r: RouteWithGeo) => r.id_ruta === parseInt(id));
      
      if (!foundRoute) {
        setError("Ruta no encontrada");
        return;
      }

      setRoute(foundRoute);
      setFormData({
        nombre_ruta: foundRoute.nombre_ruta,
        descripcion: foundRoute.descripcion || "",
        id_campus: foundRoute.id_campus
      });
      setSelectedPlaces(foundRoute.placeIds || []);

      // Fetch places data
      const placesResponse = await fetch("/api/places/getAll");
      const placesData = await placesResponse.json();
      setAllPlaces(placesData);

      // Fetch campuses data
      const campusResponse = await fetch("/api/getCampus");
      const campusData = await campusResponse.json();
      setCampuses(campusData);

    } catch (error) {
      console.error("Error al cargar datos:", error);
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (loading) return;

    const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    const trigger = isTouch ? "click" : "mouseenter focus";

    const instances: Instance[] = tippy(".uc-tooltip", {
      content: (ref) => ref.getAttribute("data-tippy-content") || "",
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "id_campus") {
      setSearchTerm(""); // Limpiar búsqueda al cambiar campus
    }
    setFormData(prev => ({
      ...prev,
      [name]: name === "id_campus" ? parseInt(value) : value
    }));
  };

  const handlePlaceToggle = (placeId: number) => {
    setSelectedPlaces(prev => {
      let updatedPlaces;
      if (prev.includes(placeId)) {
        updatedPlaces = prev.filter(id => id !== placeId);
      } else {
        updatedPlaces = [...prev, placeId];
      }

      // Update the GeoJSON for the map
      const updatedAssociatedPlaces = allPlaces.filter(place => updatedPlaces.includes(place.id_lugar));
      const updatedGeojson = enrichGeojsonFeatures(route, updatedAssociatedPlaces);
      setEnrichedGeojsonState(updatedGeojson);

      return updatedPlaces;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const confirmSave = async () => {
    if (submitting) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/routes/updateRoute/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          placeIds: selectedPlaces
        })
      });

      const result = await response.json();

      if (response.ok) {
        router.push('/admin/routes');
      } else {
        setError(result.message || 'Error al actualizar la ruta');
        setShowConfirmModal(false);
      }
    } catch (error) {
      console.error('Error al actualizar ruta:', error);
      setError('Error interno del servidor');
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter places to only include those associated with the route
  const associatedPlaces = allPlaces.filter(place => route?.placeIds?.includes(place.id_lugar));

  const enrichGeojsonFeatures = (route: RouteWithGeo | null, places: Place[]) => {
    const placesGeojsonRaw = places.map((place: Place) => (place as any).featureCollection || place.geojson).filter(Boolean);

    const placesGeojson = placesGeojsonRaw.map((geojson: any, index: number) => {
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

    if (route?.featureCollection) {
      route.featureCollection.features = route.featureCollection.features.map((feature: Feature) => {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            stroke: route.color,
          },
        };
      });
    }

    if (!route?.featureCollection) {
      return { routeGeojson: null, placesGeojson };
    }

    return { routeGeojson: route.featureCollection, placesGeojson };
  };

  const enrichedGeojson = enrichGeojsonFeatures(route, associatedPlaces);
  const [enrichedGeojsonState, setEnrichedGeojsonState] = useState(enrichedGeojson);

  // Assign color and icon dynamically using MapUtils
  if (route) {
    route.color = MapUtils.routeIdToColor(route.id_ruta.toString());
    route.icon = MapUtils.routeIdToIcon(route.id_ruta);

    // Apply color to the route's GeoJSON features
    if (route.featureCollection) {
      route.featureCollection.features = route.featureCollection.features.map((feature: Feature) => {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            stroke: route.color, // Add stroke color for the route line
          },
        };
      });
    }
  }

  if (loading) return <div>Cargando datos de la ruta...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!route) return <div>Ruta no encontrada</div>;

  // Filter places by selected campus and search term
  const filteredPlaces = allPlaces
    .filter(place => place.id_campus === formData.id_campus)
    .filter(place => {
      if (!searchTerm.trim()) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        place.nombre_lugar.toLowerCase().includes(searchLower) ||
        place.nombre_tipo_lugar.toLowerCase().includes(searchLower) ||
        (place.facultad && place.facultad.toLowerCase().includes(searchLower))
      );
    });

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <div className="form-container" style={{ maxWidth: 800, margin: "2rem auto", width: "100%" }}>
        <h1>Editar Ruta</h1>
        <br />
        
        <form ref={formRef} onSubmit={handleSubmit}>
          {/* Nombre de la ruta */}
          <div className="uc-form-group">
            <label className="uc-label-help" htmlFor="nombre_ruta">
              Nombre de la ruta
              <span className="uc-tooltip" data-tippy-content="Nombre descriptivo de la ruta">
                <i className="uc-icon">info</i>
              </span>
            </label>
            <input
              id="nombre_ruta"
              name="nombre_ruta"
              type="text"
              className="uc-input-style"
              value={formData.nombre_ruta}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Campus */}
          <div className="uc-form-group">
            <label className="uc-label-help" htmlFor="id_campus">
              Campus
              <span className="uc-tooltip" data-tippy-content="Campus al que pertenece la ruta">
                <i className="uc-icon">info</i>
              </span>
            </label>
            <select
              id="id_campus"
              name="id_campus"
              className="uc-input-style"
              value={formData.id_campus}
              onChange={handleInputChange}
              required
            >
              <option value={0}>Seleccionar campus</option>
              {campuses.map((campus) => (
                <option key={campus.id_campus} value={campus.id_campus}>
                  {campus.nombre_campus}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div className="uc-form-group">
            <label className="uc-label-help" htmlFor="descripcion">
              Descripción
              <span className="uc-tooltip" data-tippy-content="Descripción detallada de la ruta (soporta Markdown)">
                <i className="uc-icon">info</i>
              </span>
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              className="uc-input-style"
              rows={6}
              value={formData.descripcion}
              onChange={handleInputChange}
              placeholder="Describe la ruta... (puedes usar Markdown)"
            />
            {formData.descripcion && (
              <div style={{ marginTop: "0.5rem" }}>
                <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>
                  Vista previa:
                </div>
                <div
                  className="markdown-preview"
                  dangerouslySetInnerHTML={{ __html: marked(formData.descripcion) }}
                  style={{
                    border: "1px solid #ccc",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    background: "#fafafa",
                    minHeight: "50px",
                    maxHeight: "200px",
                    overflowY: "auto"
                  }}
                />
              </div>
            )}
          </div>

          {/* Lugares disponibles */}
          {formData.id_campus > 0 && (
            <div className="uc-form-group">
              <label className="uc-label-help">
                Lugares en la ruta
                <span className="uc-tooltip" data-tippy-content="Selecciona los lugares que forman parte de esta ruta">
                  <i className="uc-icon">info</i>
                </span>
              </label>
              
              {/* Buscador de lugares */}
              <div style={{ marginBottom: "1rem", position: "relative" }}>
                <input
                  type="text"
                  placeholder="Buscar lugares por nombre, tipo o facultad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="uc-input-style"
                  style={{
                    background: "url('data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'><circle cx='11' cy='11' r='8'/><path d='M21 21l-4.35-4.35'/></svg>') no-repeat 12px center",
                    paddingLeft: "40px",
                    paddingRight: searchTerm ? "40px" : "12px"
                  }}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    title="Limpiar búsqueda"
                  >
                    <i className="uc-icon" style={{ fontSize: "16px", color: "#666" }}>close</i>
                  </button>
                )}
              </div>
              
              {/* Información de búsqueda */}
              {searchTerm && (
                <div style={{ 
                  fontSize: "0.9rem", 
                  color: "#666", 
                  marginBottom: "0.5rem",
                  fontStyle: "italic",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <i className="uc-icon" style={{ fontSize: "16px" }}>search</i>
                  {filteredPlaces.length > 0 
                    ? `${filteredPlaces.length} lugar${filteredPlaces.length !== 1 ? 'es' : ''} encontrado${filteredPlaces.length !== 1 ? 's' : ''} para "${searchTerm}"`
                    : `Sin resultados para "${searchTerm}"`
                  }
                </div>
              )}

              <div style={{ 
                maxHeight: "300px", 
                overflowY: "auto", 
                border: "1px solid #ccc", 
                borderRadius: "4px", 
                padding: "1rem",
                backgroundColor: "#f8f9fa"
              }}>
                {filteredPlaces.length > 0 ? (
                  filteredPlaces.map((place) => (
                    <div key={place.id_lugar} style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      marginBottom: "8px",
                      padding: "8px",
                      backgroundColor: selectedPlaces.includes(place.id_lugar) ? "#e3f2fd" : "transparent",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                    onClick={() => handlePlaceToggle(place.id_lugar)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlaces.includes(place.id_lugar)}
                        onChange={() => handlePlaceToggle(place.id_lugar)}
                        style={{ marginRight: "12px" }}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                        {place.icono && (
                          <i className="uc-icon" style={{ 
                            color: place.color_icono || "#0176DE", 
                            fontSize: "18px" 
                          }}>
                            {place.icono}
                          </i>
                        )}
                        <div style={{ flex: 1 }}>
                          <div><strong>{place.nombre_lugar}</strong> - {place.nombre_tipo_lugar}</div>
                          {place.facultad && (
                            <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "2px" }}>
                              <i className="uc-icon" style={{ fontSize: "14px", marginRight: "4px" }}>school</i>
                              {place.facultad}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
                    {searchTerm ? (
                      <>
                        <i className="uc-icon" style={{ fontSize: "48px", marginBottom: "1rem", display: "block" }}>search_off</i>
                        <p style={{ margin: "0 0 1rem 0", fontWeight: "500" }}>No se encontraron lugares</p>
                        <p style={{ margin: 0, fontSize: "0.9rem" }}>Intenta con otros términos de búsqueda</p>
                        <button
                          type="button"
                          onClick={() => setSearchTerm("")}
                          className="uc-btn btn-secondary"
                          style={{ marginTop: "1rem", fontSize: "0.9rem" }}
                        >
                          Ver todos los lugares
                        </button>
                      </>
                    ) : (
                      <>
                        <i className="uc-icon" style={{ fontSize: "48px", marginBottom: "1rem", display: "block" }}>location_off</i>
                        <p style={{ margin: 0 }}>No hay lugares disponibles en este campus</p>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* Contadores */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", fontSize: "0.9rem" }}>
                {selectedPlaces.length > 0 && (
                  <div style={{ color: "#0176DE", fontWeight: "500" }}>
                    <i className="uc-icon" style={{ fontSize: "16px", marginRight: "4px" }}>check_circle</i>
                    {selectedPlaces.length} lugar{selectedPlaces.length !== 1 ? 'es' : ''} seleccionado{selectedPlaces.length !== 1 ? 's' : ''}
                  </div>
                )}
                {filteredPlaces.length > 0 && (
                  <div style={{ color: "#666" }}>
                    {filteredPlaces.length} de {allPlaces.filter(p => p.id_campus === formData.id_campus).length} lugares
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Título del mapa */}
          <div style={{ marginTop: "2rem" }}>
            <h3 style={{ color: "#0176DE", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="uc-icon">map</i>
              Mapa de la Ruta
            </h3>
          </div>

          {/* Mapa de la ruta */}
          <div style={{ marginTop: "1rem", height: "400px", borderRadius: "8px", overflow: "hidden" }}>
            <RouteMapProvider 
              routeGeojson={enrichedGeojsonState.routeGeojson} 
              placesGeojson={enrichedGeojsonState.placesGeojson}
            >
              <RouteMap />
            </RouteMapProvider>
          </div>

          {/* Botones */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
            <button type="submit" className="uc-btn btn-featured" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar Cambios"}
            </button>
            <button
              type="button"
              className="uc-btn btn-secondary"
              style={{ backgroundColor: "#F24F4F", color: "white" }}
              onClick={() => router.push("/admin/routes")}
            >
              Cancelar
            </button>
          </div>
        </form>

      </div>

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div className="uc-modal-overlay" role="dialog" aria-modal="true">
          <div style={{ width: "90%", minWidth: 380, maxWidth: 600 }}>
            <div className="uc-message warning mb-32">
              <a
                href="#"
                className="uc-message_close-button"
                onClick={(e) => { e.preventDefault(); setShowConfirmModal(false); }}
              >
                <i className="uc-icon">close</i>
              </a>
              <div className="uc-message_body">
                <h2 className="mb-24">
                  <i className="uc-icon warning-icon">help</i> Confirmar cambios
                </h2>
                <p className="no-margin">
                  ¿Estás seguro de que deseas guardar los cambios en la ruta <strong>{formData.nombre_ruta}</strong>?
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: 24 }}>
                  <a
                    href="#"
                    className="uc-btn btn-secondary text-center"
                    style={{ backgroundColor: '#00AA00', color: 'white' }}
                    onClick={(e) => { e.preventDefault(); if (!submitting) confirmSave(); }}
                  >
                    Sí, guardar cambios
                  </a>
                  <button 
                    className="uc-btn btn-secondary text-center" 
                    onClick={() => setShowConfirmModal(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}