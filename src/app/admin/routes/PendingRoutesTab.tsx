"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";

import tippy, { Instance } from "tippy.js";
import "tippy.js/dist/tippy.css";

type RouteForApproval = {
  id_ruta: number;
  nombre_ruta: string;
  nombre_campus: string;
  descripcion: string;
  placeIds: number[];
  id_ubicacion_geografica: number;
  isEmpty?: boolean;
  key?: string;
};

export default function PendingRoutesTab() {
  const [rutas, setRutas] = useState<RouteForApproval[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    action: "aprobar" | "rechazar";
    ruta: RouteForApproval | null;
  }>({ action: "aprobar", ruta: null });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  
  // Calculate total pages based on all data
  const totalPages = Math.ceil(rutas.length / pageSize);
  
  // Get paginated data
  const paginatedRutas = rutas.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  
  // Create empty rows to fill the page
  const emptyRowsNeeded = Math.max(0, pageSize - paginatedRutas.length);
  const emptyRows = Array.from({ length: emptyRowsNeeded }, (_, index) => ({
    id_ruta: 0,
    nombre_ruta: "",
    nombre_campus: "",
    descripcion: "",
    placeIds: [],
    id_ubicacion_geografica: 0,
    isEmpty: true,
    key: `empty-${currentPage}-${index}`
  }));
  
  // Combine data with empty rows
  const displayRows = [...paginatedRutas, ...emptyRows] as (RouteForApproval & { isEmpty?: boolean; key?: string })[];

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
    fetchPendingRoutes();
  }, []);

  const fetchPendingRoutes = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/routes/pending");
      const rutasData = response.data.map((route: any) => ({
        id_ruta: route.id_ruta,
        nombre_ruta: route.nombre_ruta,
        nombre_campus: route.nombre_campus,
        descripcion: route.descripcion || "",
        placeIds: route.placeIds || [],
        id_ubicacion_geografica: route.id_ubicacion_geografica
      }));
      setRutas(rutasData);
    } catch (err) {
      console.error("Error cargando rutas pendientes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!confirmAction.ruta) return;
    const { id_ruta } = confirmAction.ruta;
    const endpoint =
      confirmAction.action === "aprobar"
        ? "/api/routes/aprobar"
        : "/api/routes/rechazar";

    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_ruta }),
      });

      setRutas((prev) =>
        prev.filter((r) => r.id_ruta !== id_ruta)
      );
    } catch (err) {
      console.error("Error en acción:", err);
    } finally {
      setModalOpen(false);
      setConfirmAction({ action: "aprobar", ruta: null });
    }
  };

  const modal = modalOpen
    ? createPortal(
        <div
          className="uc-modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            className={`uc-modal_content uc-message mb-32 ${
              confirmAction.action === "aprobar" ? "success" : "error"
            }`}
            style={{
              width: "90%",
              maxWidth: 520,
              borderTop:
                confirmAction.action === "rechazar"
                  ? "4px solid #F24F4F"
                  : undefined,
            }}
          >
            <button
              className="uc-message_close-button"
              onClick={(e) => {
                e.preventDefault();
                setModalOpen(false);
                setConfirmAction({ action: "aprobar", ruta: null });
              }}
            >
              <i className="uc-icon">close</i>
            </button>
            <div className="uc-message_body" style={{ textAlign: "center" }}>
              <h2
                className="mb-24"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {confirmAction.action === "aprobar" ? (
                  <i className="uc-icon warning-icon">check</i>
                ) : (
                  <span
                    className="material-icons" aria-hidden="true"
                    style={{ color: "#F24F4F", fontSize: "28px" }}
                  >
                    close
                  </span>
                )}
                {confirmAction.action === "aprobar"
                  ? "Aprobar ruta"
                  : "Rechazar ruta"}
              </h2>
              <p className="no-margin">
                ¿Estás seguro de que deseas{" "}
                {confirmAction.action === "aprobar" ? "aprobar" : "rechazar"} la
                ruta <strong>{confirmAction.ruta?.nombre_ruta}</strong>?
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "12px",
                  marginTop: "24px",
                }}
              >
                <button
                  className="uc-btn btn-cta"
                  style={{
                    backgroundColor: '#0176DE',
                    color: "#fff",
                  }}
                  onClick={handleAction}
                >
                  Confirmar
                </button>
                <button
                  className="uc-btn btn-secondary"
                  onClick={() => {
                    setModalOpen(false);
                    setConfirmAction({ action: "aprobar", ruta: null });
                  }}
                  style={{ backgroundColor: '#F24F4F', color: 'white' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  if (loading) return <p>Cargando rutas en construcción...</p>;
  if (!rutas.length) return <p>No hay rutas pendientes de aprobación.</p>;

  return (
    <div className="container">
      <div className="results-table">
        <table className="uc-table" style={{ width: "100%", marginBottom: "24px" }}>
          <caption>Rutas en construcción por aprobar</caption>
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Nombre</th>
            <th scope="col">Campus</th>
            <th scope="col">Lugares</th>
            <th scope="col">Descripción</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((ruta, index) => (
            <tr key={ruta.key || ruta.id_ubicacion_geografica || `row-${index}`} className={index % 2 === 0 ? "active" : ""}>
              <td>{ruta.isEmpty ? "" : ruta.id_ruta}</td>
              <td>
                {ruta.isEmpty ? (
                  <span style={{ color: "transparent", userSelect: "none" }}>Texto invisible</span>
                ) : (
                  ruta.nombre_ruta || (
                    <span style={{ color: "transparent", userSelect: "none" }}>Texto invisible</span>
                  )
                )}
              </td>
              <td>
                {ruta.isEmpty ? (
                  <span style={{ color: "transparent", userSelect: "none" }}>Texto invisible</span>
                ) : (
                  ruta.nombre_campus || (
                    <span style={{ color: "transparent", userSelect: "none" }}>Texto invisible</span>
                  )
                )}
              </td>
              <td>
                {!ruta.isEmpty && ruta.placeIds ? (
                  <span style={{ 
                    backgroundColor: "#e8f4fd", 
                    color: "#0176DE", 
                    padding: "4px 8px", 
                    borderRadius: "12px", 
                    fontSize: "0.875rem",
                    fontWeight: "500"
                  }}>
                    {ruta.placeIds.length} lugares
                  </span>
                ) : (
                  ruta.isEmpty && <span style={{ color: "transparent", userSelect: "none" }}>Texto invisible</span>
                )}
              </td>
              <td>
                {!ruta.isEmpty ? (
                  <span className="uc-tooltip" data-tippy-content={ruta.descripcion || "Sin descripción"}>
                    {ruta.descripcion 
                      ? ruta.descripcion.length > 50 
                        ? `${ruta.descripcion.substring(0, 50)}...` 
                        : ruta.descripcion
                      : "Sin descripción"
                    }
                  </span>
                ) : (
                  <span style={{ color: "transparent", userSelect: "none" }}>Texto invisible</span>
                )}
              </td>
              <td>
                {!ruta.isEmpty && ruta.id_ruta && (
                  <div style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "center",
                  }}>
                <button
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  aria-label="Aprobar"
                  onClick={() => {
                    setConfirmAction({ action: "aprobar", ruta });
                    setModalOpen(true);
                  }}
                >
                  <i className="uc-icon" style={{ fontSize: 22, color: '#28a745' }}>check</i>
                </button>
                <button
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  aria-label="Rechazar"
                  onClick={() => {
                    setConfirmAction({ action: "rechazar", ruta });
                    setModalOpen(true);
                  }}
                >
                  <i className="uc-icon" style={{ fontSize: 22, color: '#F24F4F' }}>delete</i>
                </button>
                <button
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  aria-label="Ver"
                  onClick={() => {
                    window.location.href = `/admin/routes/view/${ruta.id_ruta}?tab=tab-01`;
                  }}
                >
                  <i className="uc-icon" style={{ fontSize: 22, color: '#FEC60D' }}>description</i>
                </button>
                <button
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  aria-label="Editar"
                  onClick={() => {
                    window.location.href = `/admin/routes/editar/${ruta.id_ruta}?tab=tab-01`;
                  }}
                >
                  <i className="uc-icon" style={{ fontSize: 22, color: '#0176DE' }}>edit</i>
                </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

      {/* UC Pagination */}
      <nav className="uc-pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '24px 0' }}>
        <button
          className="uc-pagination_prev mr-12"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          aria-label="Anterior"
        >
          <i className="uc-icon">keyboard_arrow_left</i>
        </button>
        <ul className="uc-pagination_pages" style={{ display: 'flex', alignItems: 'center', gap: '4px', listStyle: 'none', margin: 0, padding: 0 }}>
          {totalPages === 0 ? (
            <li className="page-item active">
              <a href="#" className="page-link" onClick={e => e.preventDefault()}>1</a>
            </li>
          ) : (
            <>
              {/* First page */}
              <li className={`page-item${currentPage === 1 ? ' active' : ''}`}>
                <a href="#" className="page-link" onClick={e => { e.preventDefault(); setCurrentPage(1); }}>1</a>
              </li>
              {/* Show pages around current, with ellipsis if needed */}
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
              {/* Last page */}
              {totalPages > 1 && (
                <li className={`page-item${currentPage === totalPages ? ' active' : ''}`}>
                  <a href="#" className="page-link" onClick={e => { e.preventDefault(); setCurrentPage(totalPages); }}>{totalPages}</a>
                </li>
              )}
            </>
          )}
        </ul>
        <button
          className="uc-pagination_next ml-12"
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          aria-label="Siguiente"
        >
          <i className="uc-icon">keyboard_arrow_right</i>
        </button>
      </nav>

      {modal}

      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          justify-content: flex-start;
          padding: 16px;
        }

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
          padding: 0.5rem;
          text-align: left;
          border: 1px solid #ccc;
        }

        @media (max-width: 768px) {
          .results-table {
            overflow-x: auto;
            max-height: calc(100vh - 150px);
            overflow-y: auto;
          }
        }
      `}</style>
    </div>
  );
}