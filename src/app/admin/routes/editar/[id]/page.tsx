"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { RouteWithGeo } from "@/app/types/routeType";
import { Place } from "@/app/types/placeType";
import tippy, { Instance } from "tippy.js";
import "tippy.js/dist/tippy.css";
import { marked } from "marked";
import { RouteMapProvider } from "@/app/components/context/RouteMapContext";
import RouteMap from "@/app/components/ui/RouteMap";
import type { Feature } from "geojson";
import MapUtils from "@/utils/MapUtils";
import AdminPageContainer from "../../../../components/ui/admin/AdminPageContainer";

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  
  // Form data
  const [formData, setFormData] = useState({
    nombre_ruta: "",
    descripcion: "",
    id_campus: 0,
    geojson: "",
    icono: "",
    color_icono: ""
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
      const routeResponse = await fetch(`/api/routes/${id}`);
      if (!routeResponse.ok) {
        if (routeResponse.status === 404) {
          setIsSuccess(false);
          setModalMessage("Ruta no encontrada");
          setModalOpen(true);
        } else {
          setIsSuccess(false);
          setModalMessage("Error al cargar la ruta");
          setModalOpen(true);
        }
        setLoading(false);
        return;
      }
      const foundRoute = await routeResponse.json();

      setRoute(foundRoute);
      setFormData({
        nombre_ruta: foundRoute.nombre_ruta,
        descripcion: foundRoute.descripcion || "",
        id_campus: foundRoute.id_campus,
        geojson: foundRoute.featureCollection ? JSON.stringify(foundRoute.featureCollection, null, 2) : "",
        icono: foundRoute.icono || "",
        color_icono: foundRoute.color_icono || ""
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
      setIsSuccess(false);
      setModalMessage("No se pudieron cargar los datos de la ruta. Por favor, verifica tu conexión e inténtalo de nuevo.");
      setModalOpen(true);
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

  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    
    // Auto-close modal after 5 seconds
    const timer = setTimeout(() => {
      setModalOpen(false);
    }, 5000);
    
    return () => {
      document.body.style.overflow = prev;
      clearTimeout(timer);
    };
  }, [modalOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "id_campus") {
      setSearchTerm(""); // Limpiar búsqueda al cambiar campus
    }
    if (name === "geojson" && value.trim()) {
      // Validate GeoJSON
      try {
        JSON.parse(value);
        // GeoJSON is valid, no action needed
      } catch {
        setIsSuccess(false);
        setModalMessage("El formato GeoJSON no es válido. Por favor, verifica que sea un JSON válido o genera uno nuevo en geojson.io");
        setModalOpen(true);
        return;
      }
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

      // The enrichedGeojsonState will be automatically updated via useMemo when selectedPlaces changes

      return updatedPlaces;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.nombre_ruta.trim()) {
      setIsSuccess(false);
      setModalMessage("Por favor, ingresa un nombre para la ruta. Este campo es obligatorio.");
      setModalOpen(true);
      return;
    }
    
    if (formData.id_campus === 0) {
      setIsSuccess(false);
      setModalMessage("Por favor, selecciona el campus al que pertenece esta ruta.");
      setModalOpen(true);
      return;
    }

    if (!formData.descripcion.trim()) {
      setIsSuccess(false);
      setModalMessage("Por favor, agrega una descripción para la ruta. Esto ayuda a los usuarios a entender qué lugares conecta.");
      setModalOpen(true);
      return;
    }

    if (!formData.icono.trim()) {
      setIsSuccess(false);
      setModalMessage("Por favor, especifica un ícono para la ruta. Puedes consultar la lista en Google Fonts Icons.");
      setModalOpen(true);
      return;
    }

    if (!formData.color_icono.trim() || formData.color_icono === "#") {
      setIsSuccess(false);
      setModalMessage("Por favor, selecciona un color para la ruta. Esto ayuda a identificarla visualmente en el mapa.");
      setModalOpen(true);
      return;
    }

    if (!formData.geojson.trim()) {
      setIsSuccess(false);
      setModalMessage("Por favor, agrega el GeoJSON de la ruta. Este campo define el recorrido en el mapa.");
      setModalOpen(true);
      return;
    }

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
          placeIds: selectedPlaces,
          geojson: (() => {
            if (!formData.geojson || !formData.geojson.trim()) return null;
            try {
              return JSON.parse(formData.geojson);
            } catch {
              throw new Error("GeoJSON inválido");
            }
          })()
        })
      });

      const result = await response.json();

      if (response.ok) {
        setShowConfirmModal(false);
        setIsSuccess(true);
        setModalMessage("¡Ruta actualizada con éxito!");
        setModalOpen(true);
      } else {
        setShowConfirmModal(false);
        setIsSuccess(false);
        setModalMessage(result.message || 'Error al actualizar la ruta');
        setModalOpen(true);
      }
    } catch (error) {
      console.error('Error al actualizar ruta:', error);
      setShowConfirmModal(false);
      setIsSuccess(false);
      setModalMessage('Error interno del servidor');
      setModalOpen(true);
    } finally {
      setSubmitting(false);
    }
  };



  // Filter places to only include those currently selected - using useMemo to prevent recalculation
  const associatedPlaces = useMemo(() => {
    return allPlaces.filter(place => selectedPlaces.includes(place.id_lugar));
  }, [allPlaces, selectedPlaces]);

  // Assign color and icon dynamically using MapUtils - using useMemo to prevent mutation in render
  const enrichedRoute = useMemo(() => {
    if (!route) return null;
    
    const routeWithColors = {
      ...route,
      color: MapUtils.routeIdToColor(route.id_ruta.toString()),
      icon: MapUtils.routeIdToIcon(route.id_ruta)
    };

    // Use GeoJSON from form if it's been modified, otherwise use original
    let featureCollection = routeWithColors.featureCollection;
    if (formData.geojson && formData.geojson.trim()) {
      try {
        featureCollection = JSON.parse(formData.geojson);
      } catch {
        // If parsing fails, use original
        featureCollection = routeWithColors.featureCollection;
      }
    }

    // Apply color to the route's GeoJSON features without mutating original
    if (featureCollection) {
      routeWithColors.featureCollection = {
        ...featureCollection,
        features: featureCollection.features.map((feature: Feature) => ({
          ...feature,
          properties: {
            ...feature.properties,
            stroke: routeWithColors.color,
          },
        }))
      };
    }

    return routeWithColors;
  }, [route, formData.geojson]);

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

    if (!route?.featureCollection) {
      return { routeGeojson: null, placesGeojson };
    }

    return { routeGeojson: route.featureCollection, placesGeojson };
  };

  // Calculate enriched geojson using useMemo to prevent unnecessary recalculations
  const enrichedGeojsonState = useMemo(() => {
    return enrichGeojsonFeatures(enrichedRoute, associatedPlaces);
  }, [enrichedRoute, associatedPlaces]);

  if (loading) return <div>Cargando datos de la ruta...</div>;
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
    <AdminPageContainer title="Editar Ruta">
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div className="form-container" style={{ maxWidth: 800, width: "100%" }}>
        
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

          {/* Ícono */}
          <div className="uc-form-group">
            <label className="uc-label-help" htmlFor="icono">
              Ícono
              <span className="uc-tooltip" data-tippy-content="Nombre del ícono de Google Fonts Icons que representará esta ruta">
                <i className="uc-icon">info</i>
              </span>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <input
                id="icono"
                name="icono"
                type="text"
                className="uc-input-style"
                value={formData.icono}
                onChange={handleInputChange}
                placeholder="route"
              />
              <i className="uc-icon" style={{ color: formData.color_icono || "#666", fontSize: "24px" }}>
                {formData.icono || "question_mark"}
              </i>
            </div>
            <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#666", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <i className="uc-icon" style={{ color: "#0078D4", fontSize: "16px" }}>info</i>
              <span>Consulta la lista de íconos en <a href="https://fonts.google.com/icons" target="_blank" rel="noopener noreferrer">Google Fonts Icons</a>.</span>
            </div>
          </div>

          {/* Color del ícono */}
          <div className="uc-form-group">
            <label className="uc-label-help" htmlFor="color_icono">
              Color de la ruta
              <span className="uc-tooltip" data-tippy-content="Color hexadecimal que se usará para el ícono y la línea de la ruta en el mapa">
                <i className="uc-icon">info</i>
              </span>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <input
                id="color_icono"
                name="color_icono"
                type="color"
                className="uc-input-style"
                value={formData.color_icono || "#0176DE"}
                onChange={handleInputChange}
                style={{ width: "60px", height: "40px", padding: "0", border: "1px solid #ccc" }}
              />
              <input
                type="text"
                className="uc-input-style"
                value={formData.color_icono}
                onChange={handleInputChange}
                name="color_icono"
                placeholder="#0176DE"
                pattern="^#[0-9A-Fa-f]{6}$"
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#666" }}>
              Este color se aplicará tanto al ícono como a la línea de la ruta en el mapa.
            </div>
          </div>

          {/* GeoJSON de la ruta */}
          <div className="uc-form-group">
            <label className="uc-label-help" htmlFor="geojson">
              GeoJSON de la ruta
              <span className="uc-tooltip" data-tippy-content="Coordenadas geográficas que definen el recorrido de la ruta en formato GeoJSON">
                <i className="uc-icon">info</i>
              </span>
            </label>
            <textarea
              id="geojson"
              name="geojson"
              className="uc-input-style font-mono"
              rows={8}
              value={formData.geojson}
              onChange={handleInputChange}
              placeholder='{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"LineString","coordinates":[...]}}]}'
              style={{ fontSize: "0.875rem" }}
            />
            <div
              className="uc-form-feedback"
              style={{ color: "#6b7280", marginTop: 6, display: "flex", alignItems: "center" }}
            >
              <i className="uc-icon" style={{ verticalAlign: "middle", marginRight: 6 }}>info</i>
              <span>
                Genere un GeoJSON en&nbsp;
                <a href="https://geojson.io" target="_blank" rel="noopener noreferrer">GeoJSON.io</a>
                &nbsp;y péguelo aquí. El mapa se actualizará automáticamente.
              </span>
            </div>
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
                        onChange={() => {}} // Evento manejado por el div padre
                        style={{ marginRight: "12px", pointerEvents: "none" }}
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
      {showConfirmModal && createPortal(
        <div className="uc-modal-overlay" role="dialog" aria-modal="true">
          <div style={{ width: "90%", maxWidth: 520 }}>
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
        </div>,
        document.body
      )}

      {/* Modal de resultado */}
      {modalOpen && createPortal(
        <div className="uc-modal-overlay" role="dialog" aria-modal="true">
          <div style={{ width: "90%", maxWidth: 520 }}>
            {isSuccess ? (
              <div className="uc-message success mb-32">
                <a
                  href="#"
                  className="uc-message_close-button"
                  onClick={(e) => {
                    e.preventDefault();
                    setModalOpen(false);
                    router.push("/admin/routes");
                  }}
                >
                  <i className="uc-icon">close</i>
                </a>
                <div className="uc-message_body">
                  <h2 className="mb-24">
                    <i className="uc-icon warning-icon">check_circle</i> Ruta actualizada con éxito
                  </h2>
                  <p className="no-margin">{modalMessage}</p>
                </div>
              </div>
            ) : (
              <div className="uc-message error mb-32">
                <a
                  href="#"
                  className="uc-message_close-button"
                  onClick={(e) => {
                    e.preventDefault();
                    setModalOpen(false);
                  }}
                >
                  <i className="uc-icon">close</i>
                </a>
                <div className="uc-message_body">
                  <h2 className="mb-24">
                    <i className="uc-icon warning-icon">error</i> Ha ocurrido un error
                  </h2>
                  <p className="no-margin">{modalMessage}</p>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
      </div>
    </AdminPageContainer>
  );
}