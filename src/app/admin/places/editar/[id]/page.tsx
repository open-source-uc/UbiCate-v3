"use client";

// Utilidad para convertir base64 a File
function dataURLtoFile(dataurl: string, filename: string) {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  return new File([u8arr], filename, { type: mime });
}

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Place, Image as PlaceImage } from "../../../../types/placeType";
import tippy, { Instance } from "tippy.js";
import "tippy.js/dist/tippy.css";

type PlaceWithImages = Place & { images: PlaceImage[] };
type Option = { id: number; nombre: string };

import { EditMapProvider } from "../../../../components/context/EditMapContext";
import EditMap from "../../../../components/ui/EditMap";
import { marked } from "marked";
import Image from "next/image";
import AdminPageContainer from "../../../../components/ui/admin/AdminPageContainer";

export default function EditarLugarPage() {
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  // Imágenes
  const [imagenesNuevas, setImagenesNuevas] = useState<{ file: File; descripcion: string }[]>([]);
  const [imagenesEliminadas, setImagenesEliminadas] = useState<number[]>([]);
  const [imagenesEditadas, setImagenesEditadas] = useState<{ id: number; descripcion: string }[]>([]);
  // Opciones para los combos
  const [campusOptions, setCampusOptions] = useState<Option[]>([]);
  const [tipoPuntoOptions, setTipoPuntoOptions] = useState<Option[]>([]);
  const [tipoGeojsonOptions, setTipoGeojsonOptions] = useState<Option[]>([]);
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  const [place, setPlace] = useState<PlaceWithImages | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Trae los datos del lugar
    if (id) {
      fetch(`/api/places/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setPlace(data);
          setLoading(false);
        })
        .catch(() => {
          setError("No se pudo cargar el lugar");
          setLoading(false);
        });
    }
    // Trae los catálogos para los combos
    fetch("/api/catalogos")
      .then((res) => res.json())
      .then((data) => {
        setCampusOptions(data.campus || []);
        setTipoPuntoOptions(data.tipo_punto || []);
        setTipoGeojsonOptions(data.tipo_geojson || []);
      });
  }, [id]);

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!place) return;
    const { name, value } = e.target;
    if (name === "geojson") {
      try {
        setPlace({ ...place, geojson: JSON.parse(value) });
      } catch {
        setError("El GeoJSON ingresado no es válido. Debe ser un objeto GeoJSON válido.");
      }
    } else if (["piso_punto", "id_campus", "id_tipo_lugar"].includes(name)) {
      setPlace({ ...place, [name]: Number(value) });
    } else {
      setPlace({ ...place, [name]: value });
    }
  };

  // Modal logic for edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowEditModal(true);
  };

  const confirmEdit = async () => {
    setShowEditModal(false);
    if (!place) return;
    setLoading(true);
    try {
      // Prepara imágenes nuevas en base64
      const nuevasImagenes = await Promise.all(imagenesNuevas.map(async (img) => {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(img.file);
        });
        let base64Final = base64;
        if (!base64.startsWith('data:')) {
          base64Final = `data:${img.file.type};base64,${base64}`;
        }
        return { base64: base64Final, descripcion: img.descripcion };
      }));

      const editadas = imagenesEditadas.filter(e => e.descripcion.trim() !== "");

      const payload = {
        ...place,
        nuevasImagenes,
        imagenesEliminadas,
        imagenesEditadas: editadas,
      };

      const res = await fetch(`/api/places/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error al guardar");
      router.back();
    } catch {
      setError("Error al guardar los cambios");
    }
    setLoading(false);
  };

  const cancelEdit = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const previousTab = searchParams.get("tab") || "tab-02";
    console.log("Redirigiendo al tab:", previousTab); // Depuración
    router.push(`/admin/places?tab=${encodeURIComponent(previousTab)}`);
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>{error}</div>;
  if (!place) return <div>No se encontró el lugar</div>;

  // Modal logic for delete
  const handleDeleteImage = (index: number) => {
    setImageToDelete(index);
    setShowDeleteModal(true);
  };

  const confirmDeleteImage = () => {
    if (imageToDelete !== null) {
      setImagenesEliminadas([...imagenesEliminadas, imageToDelete]);
      setImageToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const cancelDeleteImage = () => {
    setImageToDelete(null);
    setShowDeleteModal(false);
  };

  return (
    <AdminPageContainer title="Editar Punto de Interés">
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div className="form-container" style={{ maxWidth: 600, width: "100%" }}>
        <form ref={formRef} onSubmit={handleEditSubmit}>
          {/* Nombre */}
          <div className="uc-form-group">
            <label className="uc-label-help" htmlFor="nombre_lugar">
              Nombre punto de interés
              <span className="uc-tooltip" data-tippy-content="Nombre descriptivo que aparecerá en el mapa">
                <i className="uc-icon">info</i>
              </span>
            </label>
            <input
              id="nombre_lugar"
              name="nombre_lugar"
              type="text"
              className="uc-input-style"
              required
              value={place.nombre_lugar ? place.nombre_lugar : ""}
              onChange={handleChange}
            />
          </div>
          {/* Descripción con preview Markdown */}
          <div className="uc-form-group">
            <label className="uc-label-help" htmlFor="descripcion">
              Descripción
              <span className="uc-tooltip" data-tippy-content="Descripción detallada del lugar (soporta formato Markdown)">
                <i className="uc-icon">info</i>
              </span>
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              className="uc-input-style"
              required
              value={place.descripcion ? place.descripcion : ""}
              onChange={handleChange}
              rows={8}
            />
            <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#666" }}>
              Vista previa:
            </div>
            <div
              className="markdown-preview"
              dangerouslySetInnerHTML={{ __html: marked(place.descripcion || "") }}
              style={{
                border: "1px solid #ccc",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                background: "#fafafa",
                minHeight: "50px",
              }}
            />
          </div>
          {/* Piso */}
          <div className="uc-form-group">
            <label className="uc-label-help" htmlFor="piso_punto">
              Piso
              <span className="uc-tooltip" data-tippy-content="Número de piso donde se encuentra el lugar">
                <i className="uc-icon">info</i>
              </span>
            </label>
            <input
              id="piso_punto"
              name="piso_punto"
              type="number"
              min={-10}
              max={50}
              className="uc-input-style"
              required
              value={place.piso_punto !== null && place.piso_punto !== undefined ? place.piso_punto : ""}
              onChange={handleChange}
            />
          </div>
          {/* Campus */}
          <div className="uc-form-group">
            <label className="uc-label-help" htmlFor="id_campus">
              Campus
              <span className="uc-tooltip" data-tippy-content="Campus universitario donde se ubica el lugar">
                <i className="uc-icon">info</i>
              </span>
            </label>
            <select
              id="id_campus"
              name="id_campus"
              className="uc-input-style"
              required
              value={place.id_campus ?? ""}
              onChange={handleChange}
            >
              <option value="" disabled hidden>Seleccionar</option>
              {campusOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          {/* Tipo de Punto */}
          <div className="uc-form-group">
            <label className="uc-label-help" htmlFor="id_tipo_lugar">
              Tipo de punto
              <span className="uc-tooltip" data-tippy-content="Categoría del lugar (biblioteca, aula, laboratorio, etc.)">
                <i className="uc-icon">info</i>
              </span>
            </label>
            <select
              id="id_tipo_lugar"
              name="id_tipo_lugar"
              className="uc-input-style"
              required
              value={place.id_tipo_lugar ?? ""}
              onChange={handleChange}
            >
              <option value="" disabled hidden>Seleccionar</option>
              {tipoPuntoOptions.map((tp) => (
                <option key={tp.id} value={tp.id}>{tp.nombre}</option>
              ))}
            </select>
          </div>
          {/* Tipo GeoJSON */}
          <div className="uc-form-group">
            <label className="uc-label-help" htmlFor="nombre_tipo_geojson">
              Tipo de GeoJSON
              <span className="uc-tooltip" data-tippy-content="Tipo de geometría: punto, línea o polígono">
                <i className="uc-icon">info</i>
              </span>
            </label>
            <select
              id="nombre_tipo_geojson"
              name="nombre_tipo_geojson"
              className="uc-input-style"
              required
              value={place.nombre_tipo_geojson ?? ""}
              onChange={handleChange}
            >
              <option value="" disabled hidden>Seleccionar</option>
              {tipoGeojsonOptions.map((t) => (
                <option key={t.id} value={t.nombre}>{t.nombre}</option>
              ))}
            </select>
          </div>
          {/* GeoJSON */}
          <div className="uc-form-group">
            <label className="uc-label-help" htmlFor="geojson">
              GeoJSON
              <span className="uc-tooltip" data-tippy-content="Coordenadas geográficas del lugar en formato GeoJSON">
                <i className="uc-icon">info</i>
              </span>
            </label>
            <textarea
              id="geojson"
              name="geojson"
              className="uc-input-style font-mono"
              rows={8}
              required
              value={typeof place.geojson === "string" ? place.geojson ?? "" : (place.geojson ? JSON.stringify(place.geojson, null, 2) : "")}
              onChange={handleChange}
            />
          </div>
          {/* Mapa pequeño para mostrar el lugar debajo del GeoJSON */}
          {place.geojson && (
            <div style={{ marginTop: '2rem' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Vista previa en el mapa</h2>
              <EditMapProvider geojson={typeof place.geojson === 'string' ? JSON.parse(place.geojson) : place.geojson}>
                <EditMap />
              </EditMapProvider>
            </div>
          )}
          {/* Arquitecto */}
          <div className="uc-form-group">
            <label className="uc-label-help" htmlFor="arquitecto">
              Arquitecto
              <span className="uc-tooltip" data-tippy-content="Nombre del arquitecto responsable del diseño (opcional)">
                <i className="uc-icon">info</i>
              </span>
            </label>
            <input
              id="arquitecto"
              name="arquitecto"
              type="text"
              className="uc-input-style"
              value={place.arquitecto ? place.arquitecto : ""}
              onChange={handleChange}
              placeholder="Nombre arquitecto"
            />
          </div>
          {/* Premio */}
          <div className="uc-form-group">
            <label className="uc-label-help" htmlFor="premio">
              Premio
              <span className="uc-tooltip" data-tippy-content="Reconocimientos o premios arquitectónicos recibidos (opcional)">
                <i className="uc-icon">info</i>
              </span>
            </label>
            <input
              id="premio"
              name="premio"
              type="text"
              className="uc-input-style"
              value={place.premio ? place.premio : ""}
              onChange={handleChange}
            />
          </div>
          {/* Imágenes existentes y nuevas al final */}
          <div className="uc-form-group">
            <label className="uc-label-help">
              Imágenes
              <span className="uc-tooltip" data-tippy-content="Fotografías del lugar para mostrar en la aplicación">
                <i className="uc-icon">info</i>
              </span>
            </label>
            {(Array.isArray(place.images) ? place.images : [])
              .filter(img => !imagenesEliminadas.includes(img.id_imagen))
              .map((img: PlaceImage, idx: number) => (
                <div key={img.id_imagen} style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8, marginBottom: 16, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                  <Image
                    src={img.binario}
                    alt={img.descripcion || `imagen-${idx}`}
                    width={180}
                    height={180}
                    style={{ display: "block", margin: "0 auto 12px auto", maxWidth: 180, maxHeight: 180, borderRadius: 8, objectFit: "contain" }}
                  />
                  <input
                    type="text"
                    value={imagenesEditadas.find(e => e.id === img.id_imagen)?.descripcion ?? img.descripcion ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const updated = imagenesEditadas.filter(e => e.id !== img.id_imagen);
                      updated.push({ id: img.id_imagen, descripcion: e.target.value });
                      setImagenesEditadas(updated);
                    }}
                    placeholder="Descripción de la imagen"
                    className="uc-input-style"
                    style={{ marginBottom: 12, width: "100%", maxWidth: 300 }}
                  />
                  <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: 4 }}>
                    <button
                      type="button"
                      className="uc-btn btn-sm btn-danger"
                      onClick={() => handleDeleteImage(img.id_imagen)}
                    >
                      <i className="uc-icon">delete</i> Quitar
                    </button>
                    <button
                      type="button"
                      className="uc-btn btn-sm btn-danger"
                      title="Subir como nueva"
                      onClick={() => {
                        setImagenesNuevas(prev => [...prev, { file: dataURLtoFile(img.binario, `imagen-${img.id_imagen}.jpg`), descripcion: img.descripcion || "" }]);
                        setImagenesEliminadas([...imagenesEliminadas, img.id_imagen]);
                      }}
                    >
                      <i className="uc-icon">add_photo_alternate</i> Añadir como nueva
                    </button>
                  </div>
                </div>
              ))}

            {/* Utilidad para convertir base64 a File */}
            {/* Puedes mover esta función fuera del componente si lo prefieres */}
            {/* Imágenes nuevas */}
            <label htmlFor="inputImagenesNuevas" style={{ marginTop: 12 }}>Agregar nuevas imágenes</label>
            <input
              id="inputImagenesNuevas"
              type="file"
              accept=".jpg,.jpeg,.png,.gif"
              multiple
              onChange={e => {
                const files = Array.from(e.target.files || []);
                const nuevos = files.map(file => ({ file, descripcion: "" }));
                setImagenesNuevas(prev => [...prev, ...nuevos]);
              }}
              className="uc-input-style"
            />
            {imagenesNuevas.map((img, idx) => (
              <div key={idx} style={{ border: "1px solid #eee", padding: 8, borderRadius: 6, marginTop: 8 }}>
                <strong>{img.file.name}</strong>
                <Image
                  src={URL.createObjectURL(img.file)}
                  alt={`preview-${idx}`}
                  width={300}
                  height={150}
                  style={{ maxWidth: "100%", maxHeight: 150, borderRadius: 6, marginBottom: 10, objectFit: "contain" }}
                />
                <input
                  type="text"
                  placeholder="Descripción de la imagen"
                  value={img.descripcion}
                  onChange={e => {
                    const updated = [...imagenesNuevas];
                    updated[idx].descripcion = e.target.value;
                    setImagenesNuevas(updated);
                  }}
                  className="uc-input-style"
                  style={{ marginBottom: 8 }}
                />
                <button
                  type="button"
                  className="uc-btn btn-sm btn-danger"
                  onClick={() => {
                    const updated = [...imagenesNuevas];
                    updated.splice(idx, 1);
                    setImagenesNuevas(updated);
                  }}
                  style={{ marginLeft: 8 }}
                >
                  <i className="uc-icon">delete</i> Quitar
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: 24 }}>
            <button type="submit" className="uc-btn btn-featured">
              Guardar
            </button>
            <button type="button" className="uc-btn btn-secondary" style={{ backgroundColor: '#F24F4F', color: 'white' }} onClick={cancelEdit}>
              Cancelar
            </button>
          </div>
          {/* Modal estilo SuggestStep para borrar imagen */}
          {showDeleteModal && (
            <div className="uc-modal-overlay" role="dialog" aria-modal="true">
              <div style={{ width: "90%", minWidth: 380, maxWidth: 600 }}>
                <div className="uc-message error mb-32">
                  <a
                    href="#"
                    className="uc-message_close-button"
                    onClick={e => { e.preventDefault(); cancelDeleteImage(); }}
                  >
                    <i className="uc-icon">close</i>
                  </a>
                  <div className="uc-message_body">
                    <h2 className="mb-24">
                      <i className="uc-icon warning-icon">error</i> Confirmar eliminación
                    </h2>
                    <p className="no-margin">¿Quieres realmente borrar la imagen?</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: 24 }}>
                      <button className="uc-btn btn-secondary text-center" style={{ backgroundColor: '#00AA00', color: 'white' }} onClick={confirmDeleteImage}>Sí, borrar</button>
                      <button className="uc-btn btn-secondary text-center" onClick={cancelDeleteImage}>No, no borrar</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Modal estilo SuggestStep para editar punto */}
          {showEditModal && (
            <div className="uc-modal-overlay" role="dialog" aria-modal="true">
              <div style={{ width: "90%", minWidth: 380, maxWidth: 600 }}>
                <div className="uc-message warning mb-32">
                  <a
                    href="#"
                    className="uc-message_close-button"
                    onClick={e => { e.preventDefault(); cancelEdit(); }}
                  >
                    <i className="uc-icon">close</i>
                  </a>
                  <div className="uc-message_body">
                    <h2 className="mb-24">
                      <i className="uc-icon warning-icon">warning</i> Confirmar edición
                    </h2>
                    <p className="no-margin">¿Quieres editar el punto?</p>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: 24 }}>
                        <button className="uc-btn btn-secondary text-center" style={{ backgroundColor: '#00AA00', color: 'white' }} onClick={confirmEdit}>Sí, editar</button>
                        <button className="uc-btn btn-secondary text-center" onClick={cancelEdit}>No, no editar</button>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
        </div>
      </div>
    </AdminPageContainer>
  );
}
