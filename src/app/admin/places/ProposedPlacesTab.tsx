"use client";

import { useEffect, useState } from "react";
import { Place } from "@/app/types/placeType";
import { createPortal } from "react-dom";

export default function ProposedPlacesTab() {
  const [lugares, setLugares] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    action: "aprobar" | "rechazar";
    lugar: Place | null;
  }>({ action: "aprobar", lugar: null });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  const totalPages = Math.ceil(lugares.length / pageSize);
  const paginatedLugares = lugares.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    fetch("/api/places/getWaitingforApproval")
      .then((res) => res.json())
      .then((data) => setLugares(data))
      .catch((err) => {
        console.error("Error cargando lugares:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async () => {
    if (!confirmAction.lugar) return;
    const { id_ubicacion_geografica } = confirmAction.lugar;
    const endpoint =
      confirmAction.action === "aprobar"
        ? "/api/places/aprobar"
        : "/api/places/rechazar";

    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id_ubicacion_geografica }),
      });

      setLugares((prev) =>
        prev.filter((l) => l.id_ubicacion_geografica !== id_ubicacion_geografica)
      );
    } catch (err) {
      console.error("Error en acción:", err);
    } finally {
      setModalOpen(false);
      setConfirmAction({ action: "aprobar", lugar: null });
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
                setConfirmAction({ action: "aprobar", lugar: null });
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
                  <i className="uc-icon warning-icon">check_circle</i>
                ) : (
                  <span
                    className="material-icons" aria-hidden="true"
                    style={{ color: "#F24F4F", fontSize: "28px" }}
                  >
                    close
                  </span>
                  
                )}
                {confirmAction.action === "aprobar"
                  ? "Aprobar lugar"
                  : "Rechazar lugar"}
              </h2>
              <p className="no-margin">
                ¿Estás seguro de que deseas{" "}
                {confirmAction.action === "aprobar" ? "aprobar" : "rechazar"} el
                lugar <strong>{confirmAction.lugar?.nombre_lugar}</strong>?
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
                  style={
                    confirmAction.action === "rechazar"
                      ? {
                          backgroundColor: '#0176DE',
                          color: "#fff",
                        }
                      : { backgroundColor: '#0176DE', color: 'white' }


                  }
                  onClick={handleAction}
                >
                  Confirmar
                </button>
                <button
                  className="uc-btn btn-secondary"
                  onClick={() => {
                    setModalOpen(false);
                    setConfirmAction({ action: "aprobar", lugar: null });
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

  if (loading) return <p>Cargando lugares propuestos...</p>;
  if (!lugares.length) return <p>No hay lugares propuestos.</p>;

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="uc-table">
        <caption>Lugares por aprobar</caption>
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Nombre</th>
            <th scope="col">Tipo</th>
            <th scope="col">Campus</th>
            <th scope="col">Descripción</th>
            <th scope="col">GeoTipo</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {paginatedLugares.map((lugar) => (
            <tr key={lugar.id_ubicacion_geografica}>
              <td>{lugar.id_lugar}</td>
              <td>{lugar.nombre_lugar}</td>
              <td>{lugar.nombre_tipo_lugar}</td>
              <td>{lugar.nombre_campus}</td>
              <td>{lugar.descripcion}</td>
              <td>{lugar.nombre_tipo_geojson}</td>
              <td
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "center",
                }}
              >
                <button
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  aria-label="Aprobar"
                  onClick={() => {
                    setConfirmAction({ action: "aprobar", lugar });
                    setModalOpen(true);
                  }}
                  title="Aprobar Lugar"
                >
                  <i className="uc-icon" style={{ fontSize: 26, color: '#00AA00' }}>check</i>
                </button>
                <button
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  aria-label="Rechazar"
                  onClick={() => {
                    setConfirmAction({ action: "rechazar", lugar });
                    setModalOpen(true);
                  }}
                  title="Eliminar Lugar"
                >
                  <i className="uc-icon" style={{ fontSize: 26, color: '#F24F4F' }}>delete</i>

                </button>
                <button
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  aria-label="Editar"
                  onClick={() => {
                    window.location.href = `/admin/places/editar/${lugar.id_lugar}?tab=tab-01`;
                  }}
                  title="Editar Lugar"
                >
                  <i className="uc-icon" style={{ fontSize: 26, color: '#0176DE' }}>edit</i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <li key={page} className={`page-item${currentPage === page ? ' active' : ''}`}>
                <a href="#" className="page-link" onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}>{page}</a>
              </li>
            ))}
          </ul>
          <button
            className="uc-pagination_next ml-12"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Siguiente"
          >
            <i className="uc-icon">keyboard_arrow_right</i>
          </button>
        </nav>
      )}

      {modal}

      <style jsx>{`
        .filters-container {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .results-table {
          width: 100%;
          display: block;
        }

        @media (max-width: 768px) {
          .results-table {
            overflow-x: auto;
            max-height: calc(100vh - 150px);
            overflow-y: auto;
          }
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 0.5rem;
          text-align: left;
          border: 1px solid #ccc;
        }

        @media (max-width: 768px) {
          .filters-container {
            align-items: flex-start;
          }

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
