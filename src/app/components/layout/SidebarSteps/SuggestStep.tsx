"use client";

import { StepTagAttributes } from "@/app/types/stepTagAttributes";
import "../../ui/css/Form.css";
import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import tippy, { Instance } from "tippy.js";
import Image from "next/image";
import "tippy.js/dist/tippy.css";
import { useMap } from "../../../components/context/MapContext";
import MapManager from "@/app/lib/mapManager";
import mapboxgl from "mapbox-gl";
import { formatGeojsonError } from "@/app/lib/geojsonErrorFormatter";
import { marked } from "marked";
import type { Feature } from "geojson";
import { useSidebar } from "../../context/SidebarContext";

type Option = { id: number; nombre: string };

export default function SuggestStep() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tipoPunto, setTipoPunto] = useState<Option[]>([]);
  const [campus, setCampus] = useState<Option[]>([]);
  const [tipoGeojson, setTipoGeojson] = useState<Option[]>([]);
  const [geojsonPlaceholder, setGeojsonPlaceholder] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [geojsonValue, setGeojsonValue] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [modalMessage, setModalMessage] = useState("¡Gracias! Su sugerencia fue enviada con éxito y será revisada a la brevedad.");
  const [imagenesSeleccionadas, setImagenesSeleccionadas] = useState<{ file: File; descripcion: string }[]>([]);

  const { mapRef } = useMap();
  const { clearQueryParams, closeSidebar } = useSidebar();

  const stepAttrs = useMemo(() => {
    const cls = (StepTagAttributes as { className?: string })?.className ?? "";
    return { ...StepTagAttributes, className: `${cls} suggest-step`.trim() };
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    
    // Auto-close modal after 5 seconds
    const timer = setTimeout(() => {
      setModalOpen(false);
      if (isSuccess) {
        clearQueryParams();
      }
    }, 5000);
    
    return () => {
      document.body.style.overflow = prev;
      clearTimeout(timer);
    };
  }, [modalOpen, isSuccess, clearQueryParams]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/catalogos", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "No se pudieron cargar los catálogos");
        setTipoPunto(data.tipo_punto || []);
        setCampus(data.campus || []);
        setTipoGeojson(data.tipo_geojson || []);
      } catch (e: unknown) {
        setIsSuccess(false);
        setModalMessage(e instanceof Error ? e.message : "No se pudieron cargar los catálogos");
        setModalOpen(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
}, [loading, imagenesSeleccionadas.length]); 

  const handleTipoChange = (value: string) => {
    if (value === "Marcador") {
      setGeojsonPlaceholder(`{"type":"Feature","properties":{},"geometry":{"type":"Point","coordinates":[-70.61,-33.49]}}`);
    } else if (value === "Polígono") {
      setGeojsonPlaceholder(`{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[-70.61,-33.49],[-70.60,-33.49],[-70.60,-33.50],[-70.61,-33.50],[-70.61,-33.49]]]}}`);
    } else if (value === "Ruta") {
      setGeojsonPlaceholder(`{"type":"Feature","properties":{},"geometry":{"type":"LineString","coordinates":[[-70.61,-33.49],[-70.605,-33.495],[-70.60,-33.50]]}}`);
    } else {
      setGeojsonPlaceholder("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const descripcion = (fd.get("descripcion") as string)?.trim();
    const tipoGeoSel = fd.get("tipoGeojson") as string;
    const geojsonRaw = (fd.get("geojson") as string) || "";
    const nombre = (fd.get("nombrePuntoInteres") as string)?.trim();
    const id_tipo_punto = Number(fd.get("id_tipo_punto"));
    const piso_punto = Number(fd.get("piso_punto"));
    const id_campus = Number(fd.get("id_campus"));

    // Validación de piso antes de cualquier otra cosa
    if (isNaN(piso_punto) || piso_punto < 1 || piso_punto > 50) {
      setSubmitting(false);
      setIsSuccess(false);
      setModalMessage("El piso debe ser un número entre 1 y 50.");
      setModalOpen(true);
      return;
    }

    try {
      const imagenes: { base64: string; descripcion?: string }[] = [];

      for (const img of imagenesSeleccionadas) {
        const file = img.file;
        const isValidType = ["image/jpeg", "image/jpg", "image/png", "image/gif"].includes(file.type);
        const isValidSize = file.size <= 3 * 1024 * 1024;

        const imageDimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
          const image = new window.Image();
          image.onload = () => resolve({ width: image.width, height: image.height });
          image.onerror = () => reject(new Error(`No se pudo cargar la imagen ${file.name}`));
          image.src = URL.createObjectURL(file);
        });

        if (!isValidType) throw new Error(`Archivo ${file.name} tiene un formato no permitido`);
        if (!isValidSize) throw new Error(`Archivo ${file.name} excede los 3 MB permitidos`);
        if (imageDimensions.width > 1500 || imageDimensions.height > 1500) {
          throw new Error(`Archivo ${file.name} excede el tamaño permitido de 1500 pixeles x 1500 pixeles`);
        }

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        imagenes.push({ base64, descripcion: img.descripcion?.trim() || undefined });
      }

      const res = await fetch("/api/places/proponer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcion,
          tipoGeojson: tipoGeoSel,
          geojsonRaw,
          imagenes,
          punto: { nombre, id_tipo_lugar: id_tipo_punto, piso_punto, id_campus },
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Error al guardar");

      setIsSuccess(true);
      setModalMessage("¡Gracias! Su sugerencia fue enviada con éxito y será revisada a la brevedad.");
      setModalOpen(true);
      setImagenesSeleccionadas([]);
      // Borra el layer 'prueba' del mapa si existe
      if (mapRef.current) {
        MapManager.removePruebaLayer(mapRef.current);
      }
    } catch (err: unknown) {
      setIsSuccess(false);
      setModalMessage(err instanceof Error ? err.message : "No se pudo enviar su sugerencia");
    } finally {
      setSubmitting(false);
    }
  };



  // Modal (uc-message)
  const modal = modalOpen
    ? createPortal(
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
                  clearQueryParams();
                }}
              >
                <i className="uc-icon">close</i>
              </a>
              <div className="uc-message_body">
                <h2 className="mb-24">
                  <i className="uc-icon warning-icon">check_circle</i> Lugar sugerido con éxito
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
    )
    : null;

  if (loading) {
    return (
      <ul {...StepTagAttributes}>
        <div className="p-6">Cargando catálogos…</div>
      </ul>
    );
  }

  return (
    <ul {...stepAttrs}>
      <div className="suggest-header">
        <button className="uc-btn btn-featured" 
        onClick={() => clearQueryParams()}
        type="button">
          Volver
          <i className="uc-icon">arrow_back_ios_new</i>
        </button>
      </div>
      <br />
      <div className="suggest-scroll">
        <div className="form-container">
          <h4>Formulario sugerencia Punto</h4>
          <br />
          <form onSubmit={handleSubmit}>
            {/* 1. Nombre */}
            <div className="uc-form-group">
              <label htmlFor="nombrePuntoInteres" className="uc-label-help">
                <span className="uc-label-text">Nombre punto de interés</span>
                <span className="uc-tooltip" data-tippy-content="Es el nombre del lugar o punto de interés">
                  <i className="uc-icon">info</i>
                </span>
              </label>
              <input
                id="nombrePuntoInteres"
                name="nombrePuntoInteres"
                type="text"
                className="uc-input-style"
                required
                placeholder="Biblioteca Central"
              />
            </div>

            {/* 2. Descripción con preview Markdown */}
            <div className="uc-form-group">
              <label htmlFor="descripcion" className="uc-label-help">
                <span className="uc-label-text">Descripción</span>
                <span className="uc-tooltip" data-tippy-content="Descripción del punto. Puedes usar Markdown para dar formato al texto">
                  <i className="uc-icon">info</i>
                </span>
              </label>

              <textarea
                id="descripcion"
                name="descripcion"
                className="uc-input-style"
                required
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={12}
                placeholder="**Biblioteca Central** del primer piso"
              />
              <div
                className="uc-form-feedback"
                style={{ color: "#6b7280", marginTop: 6, display: "flex", alignItems: "center" }}
              >
                <i className="uc-icon" style={{ verticalAlign: "middle", marginRight: 6 }}>info</i>
                <span>
                  Genere una descripción en Markdown en&nbsp;
                  <a href="https://stackedit.io/app#" target="_blank" rel="noopener noreferrer">Stackedit.io</a>
                  &nbsp;y péguelo aquí.
                </span>
              </div>

              <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#666" }}>
                Vista previa:
              </div>
              <div
                className="markdown-preview"
                dangerouslySetInnerHTML={{ __html: marked(descripcion) }}
                style={{
                  border: "1px solid #ccc",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  background: "#fafafa",
                  minHeight: "50px",
                }}
              />
            </div>

            {/* 3. Piso como input libre */}
            <div className="uc-form-group">
              <label htmlFor="piso_punto" className="uc-label-help">
                <span className="uc-label-text">Piso</span>
                <span className="uc-tooltip" data-tippy-content="Es el piso donde se encuentra el punto de interés (1 a 50)">
                  <i className="uc-icon">info</i>
                </span>
              </label>
              <input
                id="piso_punto"
                name="piso_punto"
                type="number"
                min="1" max="50"
                className="uc-input-style"
                required
                placeholder="1"
              />
            </div>

            {/* 4. Campus */}
            <div className="uc-form-group">
              <label htmlFor="id_campus" className="uc-label-help">
                <span className="uc-label-text">Campus</span>
                <span className="uc-tooltip" data-tippy-content="Es el campus donde se encuentra el punto de interés">
                  <i className="uc-icon">info</i>
                </span>
              </label>
              <select
                id="id_campus"
                name="id_campus"
                className="uc-input-style"
                required
                defaultValue=""
              >
                <option value="" disabled hidden>Seleccionar</option>
                {campus.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            {/* 5. Tipo de Punto */}
            <div className="uc-form-group">
              <label htmlFor="id_tipo_punto" className="uc-label-help">
                <span className="uc-label-text">Tipo de punto</span>
                <span className="uc-tooltip" data-tippy-content="Es el tipo de punto de interés">
                  <i className="uc-icon">info</i>
                </span>
              </label>
              <select
                id="id_tipo_punto"
                name="id_tipo_punto"
                className="uc-input-style"
                required
                defaultValue=""
              >
                <option value="" disabled hidden>Seleccionar</option>
                {tipoPunto.map((tp) => (
                  <option key={tp.id} value={tp.id}>{tp.nombre}</option>
                ))}
              </select>
            </div>

            {/* 6. Tipo GeoJSON */}
            <div className="uc-form-group">
              <label htmlFor="tipoGeojson" className="uc-label-help">
                <span className="uc-label-text">Tipo de GeoJSON</span>
                <span className="uc-tooltip" data-tippy-content="Tipo de geometría (Point, Polygon, LineString)">
                  <i className="uc-icon">info</i>
                </span>
              </label>
              <select
                id="tipoGeojson"
                name="tipoGeojson"
                className="uc-input-style"
                required
                defaultValue=""
                onChange={(e) => handleTipoChange(e.target.value)}
              >
                <option value="" disabled hidden>Seleccionar</option>
                {tipoGeojson.map((t) => (
                  <option key={t.id} value={t.nombre}>{t.nombre}</option>
                ))}
              </select>
            </div>

            {/* 7. GeoJSON */}
            <div className="uc-form-group">
              <label htmlFor="geojson" className="uc-label-help">
                <span className="uc-label-text">GeoJSON</span>
                <span
                  className="uc-tooltip"
                  data-tippy-content="Debe ser un Feature o FeatureCollection válido."
                >
                  <i className="uc-icon">info</i>
                </span>
              </label>
              <textarea
                id="geojson"
                name="geojson"
                className="uc-input-style font-mono"
                rows={14}
                required
                value={geojsonValue}
                onChange={(e) => setGeojsonValue(e.target.value)}
                placeholder={
                  geojsonPlaceholder ||
                  `{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[ -70.61, -33.49 ], [ -70.60, -33.49 ], [ -70.60, -33.50 ], [ -70.61, -33.50 ], [ -70.61, -33.49 ]]]
      }
    }
  ]
}`
                }
              />

              <div
                className="uc-form-feedback"
                style={{ color: "#6b7280", marginTop: 6, display: "flex", alignItems: "center" }}
              >
                <i className="uc-icon" style={{ verticalAlign: "middle", marginRight: 6 }}>info</i>
                <span>
                  Genere un GeoJSON en&nbsp;
                  <a href="https://geojson.io" target="_blank" rel="noopener noreferrer">GeoJSON.io</a>
                  &nbsp;y péguelo aquí.
                </span>
              </div>
            </div>

            {/* Botón de prueba en mapa */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
              <button
                type="button"
                className="uc-btn btn-cta"
                onClick={() => {
                  try {
                    const value = geojsonValue.trim();
                    if (!value) throw new Error("El campo GeoJSON está vacío");

                    let geojson;
                    try {
                      geojson = JSON.parse(value);

                      const isFeature = geojson.type === "Feature";
                      const isFeatureCollection = geojson.type === "FeatureCollection";
                      const hasGeometry = isFeature
                        ? !!geojson.geometry
                        : !!geojson.features?.[0]?.geometry;

                      if (!isFeature && !isFeatureCollection) {
                        throw new Error("Debe ser un Feature o FeatureCollection");
                      }

                      if (!hasGeometry) {
                        throw new Error("Falta geometría válida en el GeoJSON");
                      }
                    } catch (err) {
                      throw new Error("GeoJSON inválido: " + (err instanceof Error ? err.message : ""));
                    }

                    const map = mapRef.current;
                    if (!map) throw new Error("Mapa no cargado");

                    // Detecta si es Point o solo Points
                    const isPoint = (g: any) => g && g.type === "Point";
                    let onlyPoints = false;
                    if (geojson.type === "Feature" && isPoint(geojson.geometry)) {
                      onlyPoints = true;
                    } else if (geojson.type === "FeatureCollection") {
                      onlyPoints = geojson.features.length > 0 && geojson.features.every((f: any) => isPoint(f.geometry));
                    }

                    // Limpia cualquier capa previa
                    MapManager.removePruebaLayer(map);

                    if (onlyPoints) {
                      // Muestra solo el/los punto(s) con drawPlaces, sin tipo (question_mark)
                      // Agrega placeName con el valor del input de nombre
                      let enriched;
                      const nombreInput = document.getElementById("nombrePuntoInteres") as HTMLInputElement | null;
                      const nombreValor = nombreInput?.value || "";
                      if (geojson.type === "Feature") {
                        enriched = {
                          ...geojson,
                          properties: {
                            ...(geojson.properties || {}),
                            placeName: nombreValor
                          }
                        };
                      } else if (geojson.type === "FeatureCollection") {
                        enriched = {
                          ...geojson,
                          features: geojson.features.map((f: any) => ({
                            ...f,
                            properties: {
                              ...(f.properties || {}),
                              placeName: nombreValor
                            }
                          }))
                        };
                      } else {
                        enriched = geojson;
                      }
                      MapManager.drawPlaces(map, enriched, { mode: "single", zoom: true });
                    } else {
                      // Polígonos o líneas
                      MapManager.drawPolygons(map, "prueba", geojson);
                    }

                    // Calcula bounds para centrar
                    const bounds = new mapboxgl.LngLatBounds();
                    let flatCoords: [number, number][] = [];

                    if (geojson.type === "Feature") {
                      const geom = geojson.geometry;
                      switch (geom.type) {
                        case "Polygon":
                          flatCoords = geom.coordinates[0];
                          break;
                        case "LineString":
                          flatCoords = geom.coordinates;
                          break;
                        case "Point":
                          flatCoords = [geom.coordinates];
                          break;
                      }
                    } else if (geojson.type === "FeatureCollection") {
                      flatCoords = geojson.features.flatMap((f: Feature) => {
                        const geom = f.geometry;
                        if (!geom) return [];
                        switch (geom.type) {
                          case "Polygon": return geom.coordinates[0];
                          case "LineString": return geom.coordinates;
                          case "Point": return [geom.coordinates];
                          default: return [];
                        }
                      });
                    }

                    if (flatCoords.length === 0) throw new Error("No se encontraron coordenadas");

                    flatCoords.forEach(([lng, lat]) => bounds.extend([lng, lat]));
                    const center = bounds.getCenter();
                    map.flyTo({ center, zoom: 17 });

                    closeSidebar();
                  } catch (err) {
                    setIsSuccess(false);
                    setModalMessage(formatGeojsonError(err));
                    setModalOpen(true);
                    console.log(err);
                  }
                }}
              >
                Prueba el GeoJSON en el mapa
              </button>
            </div>
            {/* 7. Imágenes */}
<div className="uc-form-group">
  <label htmlFor="inputImagenes" className="uc-label-help">
    <span className="uc-label-text">Imágenes</span>
    <span
      className="uc-tooltip"
      data-tippy-content="Puedes subir una o más imágenes en formato JPG, JPEG, PNG o GIF con una descripción opcional"
    >
      <i className="uc-icon">info</i>
    </span>
  </label>

  <input
    id="inputImagenes"
    type="file"
    accept=".jpg,.jpeg,.png,.gif"
    multiple
    onChange={(e) => {
      const files = Array.from(e.target.files || []);
      const nuevos = files.map((file) => ({ file, descripcion: "" }));
      setImagenesSeleccionadas((prev) => [...prev, ...nuevos]);
    }}
    className="uc-input-style"
  />


              {/* Lista de previews + descripciones dinámicas */}
              {imagenesSeleccionadas.map((img, idx) => (
                <div
                  key={idx}
                  style={{
                    marginTop: "1rem",
                    border: "1px solid #ddd",
                    padding: 12,
                    borderRadius: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center", // <-- centra horizontalmente los hijos
                    textAlign: "center",   // <-- centra texto como el nombre del archivo
                  }}
                >
                  <div style={{ marginBottom: 8 }}>
                    <strong>{img.file.name}</strong>
                  </div>

                  <Image
                    src={URL.createObjectURL(img.file)}
                    alt={`preview-${idx}`}
                    width={300}
                    height={150}
                    style={{
                      maxWidth: "100%",
                      maxHeight: 150,
                      borderRadius: 6,
                      marginBottom: 10,
                      objectFit: "contain",
                    }}
                  />

                  <input
                    type="text"
                    placeholder="Descripción de la imagen"
                    value={img.descripcion}
                    onChange={(e) => {
                      const updated = [...imagenesSeleccionadas];
                      updated[idx].descripcion = e.target.value;
                      setImagenesSeleccionadas(updated);
                    }}
                    className="uc-input-style"
                    style={{ marginBottom: 10 }} // opcional
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...imagenesSeleccionadas];
                      updated.splice(idx, 1);
                      setImagenesSeleccionadas(updated);
                    }}
                    className="uc-btn btn-sm btn-danger mt-2 btn-secondary text-center"
                  >
                    <i className="uc-icon">delete</i>
                    Quitar imagen
                  </button>
                </div>
              ))}
            </div>

            <button type="submit" className="uc-btn btn-featured" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar"}
            </button>
          </form>
        </div>
      </div>

      {modal}
    </ul>
  );
}
