"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Place, Image as ImageType } from "@/app/types/placeType";
import tippy, { Instance } from "tippy.js";
import "tippy.js/dist/tippy.css";
import AdminPageContainer from "../../../../components/ui/admin/AdminPageContainer";
import { marked } from "marked";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/style.css";
import NextImage from "next/image";

type PlaceWithImages = Place & {
  images?: ImageType[];
};

type SizedImage = ImageType & { width?: number; height?: number };

// Calcula tamaño real de una imagen base64
function getImageSize(base64: string): Promise<{ w: number; h: number }> {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 1200, h: 800 }); // fallback
    img.src = base64;
  });
}

export default function ViewPlacePage() {
  const [place, setPlace] = useState<PlaceWithImages | null>(null);
  const [sized, setSized] = useState<SizedImage[] | null>(null);
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Mostrar 10 registros por página en el histórico
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  const fetchPlaceDetails = useCallback(async () => {
    if (!id) {
      setError("ID de lugar inválido");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Obtener detalles del lugar
      const placeResponse = await fetch(`/api/places/${id}`);
      if (!placeResponse.ok) {
        if (placeResponse.status === 404) {
          setError("Lugar no encontrado");
        } else {
          setError("Error al cargar el lugar");
        }
        setLoading(false);
        return;
      }
      const foundPlace = await placeResponse.json();
      setPlace(foundPlace);

      // Obtener histórico del lugar
      try {
        const historicoResponse = await fetch(`/api/places/historico?id_ubicacion=${foundPlace.id_ubicacion_geografica}`);
        if (historicoResponse.ok) {
          const historicoData = await historicoResponse.json();
          if (historicoData.success) {
            setHistorico(historicoData.data);
          }
        }
      } catch (err) {
        console.error("Error cargando histórico:", err);
        // No bloqueamos la carga del lugar si falla el histórico
      }
    } catch (error) {
      console.error("Error al cargar detalles del lugar:", error);
      setError("Error al cargar los datos del lugar");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setError("ID de lugar inválido");
      setLoading(false);
      return;
    }

    fetchPlaceDetails();
  }, [fetchPlaceDetails, id]);

  // Calcula tamaños reales de las imágenes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!place?.images?.length) {
        setSized(null);
        return;
      }
      const results = await Promise.all(
        place.images
          .filter(img => !!img.binario)
          .map(async img => {
            try {
              const { w, h } = await getImageSize(img.binario as string);
              return { ...img, width: w, height: h } as SizedImage;
            } catch {
              return { ...img, width: 1200, height: 800 } as SizedImage;
            }
          })
      );
      if (!cancelled) setSized(results);
    })();
    return () => {
      cancelled = true;
    };
  }, [place?.images]);

  // Inicializa PhotoSwipe + UI (bullets + caption)
  useEffect(() => {
    if (!sized?.length) return;

    const lightbox = new PhotoSwipeLightbox({
      gallery: ".uc-gallery",
      children: "a",
      pswpModule: () => import("photoswipe"),
    });

    lightbox.on("uiRegister", () => {
      const pswp = lightbox.pswp as any;
      if (!pswp || !pswp.ui || typeof pswp.ui.registerElement !== "function") return;

      const ui = pswp.ui as any;

      // Bullets indicator
      ui.registerElement({
        name: "bulletsIndicator",
        className: "pswp__bullets-indicator",
        appendTo: "wrapper",
        onInit: (el: HTMLElement, instance: any) => {
          const bullets: HTMLDivElement[] = [];
          let active = -1;

          for (let i = 0; i < instance.getNumItems(); i++) {
            const b = document.createElement("div");
            b.className = "pswp__bullet";
            b.onclick = () => instance.goTo(bullets.indexOf(b));
            el.appendChild(b);
            bullets.push(b);
          }

          instance.on("change", () => {
            if (active >= 0) bullets[active].classList.remove("pswp__bullet--active");
            bullets[instance.currIndex].classList.add("pswp__bullet--active");
            active = instance.currIndex;
          });
        },
      });

      // Caption centrado
      ui.registerElement({
        name: "customCaption",
        order: 9,
        isButton: false,
        appendTo: "root",
        className: "pswp__custom-caption",
        html: "",
        onInit: (el: HTMLElement, instance: any) => {
          const update = () => {
            const slideEl = instance.currSlide?.data?.element as Element | null;
            let txt = "";
            if (slideEl) {
              const img = slideEl.querySelector("img");
              txt = img?.getAttribute("title") || img?.getAttribute("alt") || "";
            }
            if (txt) {
              el.classList.remove("hidden-caption-content");
              el.innerHTML = txt;
            } else {
              el.classList.add("hidden-caption-content");
              el.innerHTML = "";
            }
          };
          instance.on("afterInit", update);
          instance.on("change", update);
        },
      });
    });

    lightbox.init();
    return () => lightbox.destroy();
  }, [sized]);

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

  if (loading) return <div>Cargando detalles del lugar...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!place) return <div>Lugar no encontrado</div>;

  // Función para obtener el estilo del badge de estado
  const getEstadoBadgeStyle = (estadoId: number) => {
    const estilos: Record<number, { bg: string; color: string; border: string; text: string }> = {
      1: { // Rechazado
        bg: "#fee2e2",
        color: "#991b1b",
        border: "#fecaca",
        text: "Rechazado"
      },
      2: { // Aceptado/Aprobado
        bg: "#d4edda",
        color: "#155724",
        border: "#c3e6cb",
        text: "Aprobado"
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

  const estadoStyle = getEstadoBadgeStyle(place.fk_id_estado_ubicacion_geografica);

  const actionButtons = (
    <div style={{ display: "flex", gap: "8px" }}>
      <button
        onClick={() => router.push(`/admin/places/editar/${place.id_lugar}`)}
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
        title="Editar lugar"
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
    <AdminPageContainer title="Detalles del Lugar" actionButton={actionButtons}>
      <div className="place-view-container">
        {/* Header con título y tipo */}
        <div className="place-header">
          <h1 style={{ fontSize: "2rem", marginBottom: "8px", color: "#0176DE" }}>
            {place.nombre_lugar}
          </h1>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <span className="uc-tag" style={{ fontSize: "1rem" }}>
              {place.nombre_tipo_lugar}
            </span>
            <span style={{ fontSize: "1rem", fontStyle: "italic", color: "#6B7280" }}>
              Campus {place.nombre_campus}
            </span>
            <span style={{
              backgroundColor: estadoStyle.bg,
              color: estadoStyle.color,
              padding: "4px 12px",
              borderRadius: "16px",
              fontSize: "0.875rem",
              fontWeight: "500",
              border: `1px solid ${estadoStyle.border}`
            }}>
              {estadoStyle.text}
            </span>
          </div>
        </div>

        {/* Place Information Card */}
        <div className="place-info-card">
          <div className="place-info-grid">
            {/* Basic Info */}
            <div>
              <h3 style={{ color: "#0176DE", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="uc-icon">info</i>
                Información General
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <strong>ID:</strong> {place.id_lugar}
                </div>
                <div>
                  <strong>Tipo de Geometría:</strong> {place.nombre_tipo_geojson}
                </div>
                {place.arquitecto && (
                  <div>
                    <strong>Arquitecto:</strong> {place.arquitecto}
                  </div>
                )}
                {place.premio && (
                  <div>
                    <strong>Premio:</strong> {place.premio}
                  </div>
                )}
                {place.facultad && (
                  <div>
                    <strong>Facultad:</strong> {place.facultad}
                  </div>
                )}
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
                minHeight: "100px",
                maxHeight: "300px",
                overflowY: "auto"
              }}>
                {place.descripcion ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: marked(place.descripcion) }}
                    style={{ lineHeight: "1.6" }}
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

        {/* Galería de Imágenes */}
        <div className="place-info-card" style={{ marginTop: "24px" }}>
          <h3 style={{ color: "#0176DE", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="uc-icon">photo_library</i>
            Galería de Imágenes {sized && sized.length > 0 && `(${sized.length})`}
          </h3>
          
          {!sized || sized.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "48px 24px", 
              color: "#6B7280",
              background: "#F9FAFB",
              borderRadius: "8px"
            }}>
              <i className="uc-icon" style={{ fontSize: "48px", color: "#D1D5DB", marginBottom: "12px" }}>photo_library</i>
              <p style={{ margin: 0, fontSize: "16px" }}>No hay imágenes disponibles para este lugar</p>
            </div>
          ) : (
            <div
              className="uc-gallery"
              style={{
                maxWidth: 800,
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "8px",
              }}
            >
              {sized.map((image, i) => {
                const base64 = image.binario;
                const mimeType = image.mime_type || "image/jpeg";
                const base64Src = base64?.startsWith("data:") 
                  ? base64 
                  : `data:${mimeType};base64,${base64}`;
                
                return image.binario ? (
                  <a
                    key={`${place.id_ubicacion_geografica}-${i}`}
                    href={base64Src}
                    data-pswp-width={image.width}
                    data-pswp-height={image.height}
                    data-cropped="true"
                    style={{ display: "block", width: "100%", height: "100%" }}
                  >
                    <NextImage
                      src={base64Src}
                      alt={place.nombre_lugar || `Imagen ${i + 1}`}
                      title={image.descripcion || place.nombre_lugar}
                      width={image.width || 1200}
                      height={image.height || 800}
                      loading="lazy"
                      sizes="(max-width: 600px) 100vw, 50vw"
                      style={{ width: "100%", height: "auto", borderRadius: 6, cursor: "pointer" }}
                      unoptimized
                    />
                  </a>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Histórico de Cambios */}
        <div className="place-info-card" style={{ marginTop: "24px" }}>
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
              <p style={{ margin: 0, fontSize: "16px" }}>No hay cambios registrados para este lugar</p>
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
                          <tr key={item.id_historico_ubicacion}>
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

        {/* Styles */}
        <style jsx>{`
          .place-view-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .place-header {
            background: white;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .place-info-card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .place-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
          }

          @media (max-width: 768px) {
            .place-info-grid {
              grid-template-columns: 1fr;
            }
          }

          h3 {
            font-size: 1.25rem;
            font-weight: 600;
          }

          strong {
            color: #374151;
            font-weight: 600;
          }

          table {
            border-collapse: collapse;
          }

          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #E5E7EB;
          }

          th {
            background: #F9FAFB;
            font-weight: 600;
            color: #374151;
          }

          tr:hover {
            background: #F9FAFB;
          }

          /* PhotoSwipe custom styles */
          :global(.pswp__bullets-indicator) {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            z-index: 10;
          }

          :global(.pswp__bullet) {
            width: 10px;
            height: 10px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            cursor: pointer;
            transition: background 0.2s;
          }

          :global(.pswp__bullet--active) {
            background: rgba(255, 255, 255, 1);
          }

          :global(.pswp__custom-caption) {
            background: rgba(0, 0, 0, 0.75);
            color: white;
            padding: 12px 24px;
            text-align: center;
            position: absolute;
            bottom: 60px;
            left: 50%;
            transform: translateX(-50%);
            border-radius: 8px;
            max-width: 80%;
            font-size: 14px;
          }

          :global(.hidden-caption-content) {
            display: none;
          }

          /* Markdown content styling */
          .place-info-card :global(h1),
          .place-info-card :global(h2),
          .place-info-card :global(h3) {
            margin-top: 1rem;
            margin-bottom: 0.5rem;
            color: #374151;
          }

          .place-info-card :global(p) {
            margin: 0.5rem 0;
          }

          .place-info-card :global(ul),
          .place-info-card :global(ol) {
            margin: 0.5rem 0;
            padding-left: 1.5rem;
          }

          .place-info-card :global(a) {
            color: #0176DE;
            text-decoration: underline;
          }

          .place-info-card :global(code) {
            background: #e9ecef;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
          }

          .place-info-card :global(pre) {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
          }

          .place-info-card :global(blockquote) {
            border-left: 4px solid #0176DE;
            padding-left: 1rem;
            margin: 1rem 0;
            color: #6B7280;
          }
        `}</style>
      </div>
    </AdminPageContainer>
  );
}
