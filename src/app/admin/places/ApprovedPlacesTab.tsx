"use client";

import { useEffect, useState } from "react";
import { Place } from "@/app/types/placeType";
import Link from "next/link";
import tippy, { Instance } from "tippy.js";
import "tippy.js/dist/tippy.css";

export default function ApprovedPlacesTab() {

  const [lugares, setLugares] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Place | null>(null);

  // Tippy tooltip initialization (must be after loading/lugares declarations)
  useEffect(() => {
    if (loading) return;

    const instances: Instance[] = tippy(".uc-tooltip", {
      content: (ref) => ref.getAttribute("data-tippy-content") || "",
      theme: "uc",
      trigger: "mouseenter focus", // Cambiar a eventos estándar
      placement: "top", // Asegurar que el tooltip esté encima del elemento
      arrow: true,
      hideOnClick: true,
      touch: true,
      appendTo: () => document.body, // Usar una función para devolver el elemento body
      zIndex: 2147483647,
      interactive: true, // Permitir interacción con el tooltip
      delay: [50, 50],
    });

    return () => instances.forEach((i) => i.destroy());
  }, [loading]);

  // Filtros y búsqueda
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [selectedName, setSelectedName] = useState<string>("");
  const [filterGeoTipo, setFilterGeoTipo] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterCampus, setFilterCampus] = useState("");

  // Extraer opciones únicas
  const geoTipos = Array.from(new Set(lugares.map(l => l.nombre_tipo_geojson))).filter(Boolean);
  const tipos = Array.from(new Set(lugares.map(l => l.nombre_tipo_lugar))).filter(Boolean);
  const campus = Array.from(new Set(lugares.map(l => l.nombre_campus))).filter(Boolean);

  // Filtrado
  const hasActiveFilter = !!filterGeoTipo || !!filterTipo || !!filterCampus;
  const filteredLugares = lugares.filter(l => {
    const matchGeo = !filterGeoTipo || l.nombre_tipo_geojson === filterGeoTipo;
    const matchTipo = !filterTipo ? true : l.nombre_tipo_lugar === filterTipo;
    const matchCampus = !filterCampus || l.nombre_campus === filterCampus;
    let matchName;
    if (hasActiveFilter) {
      matchName = selectedName ? l.nombre_lugar === selectedName : (!search || l.nombre_lugar.toLowerCase().includes(search.toLowerCase()));
    } else {
      matchName = selectedName ? l.nombre_lugar === selectedName : (!search || l.nombre_lugar.toLowerCase().includes(search.toLowerCase()));
    }
    return matchGeo && matchTipo && matchCampus && matchName;
  });

  // Autocomplete
  useEffect(() => {
    if (search.length > 0) {
      // Usar lugares filtrados solo por los filtros, no por el texto de búsqueda
      const lugaresFiltradosSinBusqueda = lugares.filter(l => {
        const matchGeo = !filterGeoTipo || l.nombre_tipo_geojson === filterGeoTipo;
        const matchTipo = !filterTipo ? true : l.nombre_tipo_lugar === filterTipo;
        const matchCampus = !filterCampus || l.nombre_campus === filterCampus;
        return matchGeo && matchTipo && matchCampus;
      });
      setSearchResults(
        lugaresFiltradosSinBusqueda
          .map(l => l.nombre_lugar)
          .filter(n => n.toLowerCase().includes(search.toLowerCase()))
          .slice(0, 8)
      );
    } else {
      setSearchResults([]);
    }
  }, [search, filterGeoTipo, filterTipo, filterCampus, lugares]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  const totalPages = Math.ceil(filteredLugares.length / pageSize);
  const paginatedLugares = filteredLugares.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    fetch("/api/places/getAll")
      .then((res) => res.json())
      .then((data) => setLugares(data))
      .catch((err) =>
        console.error("Error cargando lugares aprobados:", err)
      )
      .finally(() => setLoading(false));
  }, []);

  const handleReject = async () => {
    if (!deleteTarget) return;
    try {
      await fetch("/api/places/rechazar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id_ubicacion_geografica }),
      });
      setLugares((prev) => prev.filter(l => l.id_ubicacion_geografica !== deleteTarget.id_ubicacion_geografica));
    } catch (err) {
      console.error("Error rechazando lugar:", err);
    } finally {
      setModalOpen(false);
      setDeleteTarget(null);
    }
  };

  const modal = modalOpen && deleteTarget ? (
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
        className="uc-modal_content uc-message mb-32 error"
        style={{ width: "90%", maxWidth: 520, borderTop: "4px solid #F24F4F" }}
      >
        <button
          className="uc-message_close-button"
          onClick={() => { setModalOpen(false); setDeleteTarget(null); }}
        >
          <i className="uc-icon">close</i>
        </button>
        <div className="uc-message_body" style={{ textAlign: "center" }}>
          <h2 className="mb-24" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
            <span className="material-icons" aria-hidden="true" style={{ color: "#F24F4F", fontSize: "28px" }}>close</span>
            Rechazar lugar
          </h2>
          <p className="no-margin">
            ¿Estás seguro de que deseas rechazar el lugar <strong>{deleteTarget.nombre_lugar}</strong>?
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "24px" }}>
            <button
              className="uc-btn btn-cta"
              style={{ backgroundColor: "#F24F4F", borderColor: "#F24F4F", color: "#fff" }}
              onClick={handleReject}
            >
              Confirmar
            </button>
            <button
              className="uc-btn btn-secondary"
              onClick={() => { setModalOpen(false); setDeleteTarget(null); }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // Revert input size to default by ensuring elements are treated as HTMLInputElement
  const inputElements = document.querySelectorAll("input.uc-tooltip");
  inputElements.forEach((input) => {
    const htmlInput = input as HTMLInputElement; // Cast to HTMLInputElement
    htmlInput.style.width = ""; // Reset width to default
    htmlInput.style.height = ""; // Reset height to default
  });

  if (loading) return <p>Cargando lugares aprobados...</p>;
  if (!lugares.length) return <p>No hay lugares aprobados.</p>;

  return (
    <div style={{ overflowX: "auto" }}>   
      {/* Filtros y búsqueda */}
      <div className="mb-24">
        <form
          style={{
            display: "flex",
            flexDirection: "column", // Default for desktop
            gap: "16px",
            marginBottom: "24px",
            background: "#fff",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
          onSubmit={e => { e.preventDefault(); setSelectedName(""); setCurrentPage(1); }}
        >
          {/* Input y botón en línea en desktop */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-end",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            <div
              className="uc-form-group"
              style={{
                display: "flex",
                flexDirection: "column",
                flex: "1 1 500px",
                position: "relative",
                minWidth: "320px",
                maxWidth: "600px",
              }}
            >
              <label className="uc-label-help" htmlFor="ucsearch">
                Nombre Lugar
                <span className="uc-tooltip" data-tippy-content="Buscador por nombre del lugar">
                  <i className="uc-icon">info</i>
                </span>
              </label>
              <input
                id="ucsearch"
                type="text"
                placeholder="Nombre"
                value={search}
                onChange={e => { setSearch(e.target.value); setSelectedName(""); setSearchResults([]); setCurrentPage(1); }}
                autoComplete="off"
                className="uc-input-style border rounded px-3 py-2 w-full"
              />
              {searchResults.length > 0 && (
                <ul
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    width: "100%",
                    background: "#fff",
                    border: "1px solid #e0e0e0",
                    borderRadius: 6,
                    zIndex: 20,
                    maxHeight: 180,
                    overflowY: "auto",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    margin: 0,
                    padding: 0,
                  }}
                >
                  {searchResults.map((name, idx) => (
                    <li
                      key={name + "-" + idx}
                      style={{
                        listStyle: "none",
                        padding: "12px 18px",
                        cursor: "pointer",
                        fontSize: "1.25rem",
                        borderBottom: idx === searchResults.length - 1 ? "none" : "1px solid #eee",
                        background: "#fff",
                      }}
                      onMouseDown={() => {
                        setSelectedName(name);
                        setSearch(name);
                        setSearchResults([]);
                        setCurrentPage(1);
                      }}
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Filtros en línea debajo en desktop */}
          <div
            style={{  
              display: "flex",
              flexDirection: "row",
              gap: "24px",
              width: "100%",
              marginTop: "8px",
              flexWrap: "wrap",
            }}
          >
            <div className="uc-form-group" style={{ flex: "1 1 30%", minWidth: "180px", maxWidth: "300px", position: "relative", top: "20px" }}>
              <label className="uc-label-help" htmlFor="geoTipo">
                GeoTipo
                <span className="uc-tooltip" data-tippy-content="Filtra por tipo de geojson">
                  <i className="uc-icon">info</i>
                </span>
              </label>
              <select id="geoTipo" className="uc-input-style" value={filterGeoTipo} onChange={e => { setFilterGeoTipo(e.target.value); setCurrentPage(1); }}
                style={{ minWidth: "100px", maxWidth: "300px" }}>
                <option value="">Todos</option>
                {geoTipos.map((g, idx) => <option key={g + '-' + idx} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="uc-form-group" style={{ flex: "1 1 30%", minWidth: "180px", maxWidth: "300px", position: "relative", top: "20px" }}>
              <label className="uc-label-help" htmlFor="tipo">
                Tipo
                <span className="uc-tooltip" data-tippy-content="Filtra por tipo de lugar">
                  <i className="uc-icon">info</i>
                </span>
              </label>
              <select id="tipo" className="uc-input-style" value={filterTipo} onChange={e => { setFilterTipo(e.target.value); setCurrentPage(1); }}
                style={{ minWidth: "100px", maxWidth: "300px" }}>
                <option value="">Todos</option>
                {tipos.map((t, idx) => <option key={t + '-' + idx} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="uc-form-group" style={{ flex: "1 1 30%", minWidth: "180px", maxWidth: "300px", position: "relative", top: "20px" }}>
              <label className="uc-label-help" htmlFor="campus">
                Campus
                <span className="uc-tooltip" data-tippy-content="Filtra por campus">
                  <i className="uc-icon">info</i>
                </span>
              </label>
              <select id="campus" className="uc-input-style" value={filterCampus} onChange={e => { setFilterCampus(e.target.value); setCurrentPage(1); }}
                style={{ minWidth: "100px", maxWidth: "300px" }}>
                <option value="">Todos</option>
                {campus.map((c, idx) => <option key={c + '-' + idx} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Reubicar el botón de 'Limpiar filtros' completamente a la derecha después de los filtros combo box */}
      <div className="filters-container">
        <button
          type="button"
          className="uc-btn btn-secondary clear-filters-button"
          onClick={() => {
            setSearch("");
            setSelectedName("");
            setFilterGeoTipo("");
            setFilterTipo("");
            setFilterCampus("");
            setCurrentPage(1);
          }}
        >
          Limpiar filtros
        </button>
      </div>

      {/* Table of approved places */}
      <div className="results-table">
        <table className="uc-table" style={{ width: "100%", marginBottom: "24px" }}>
          <thead>
            <tr>
              <th>Id</th>
              <th>Nombre</th>
              <th>Tipo GeoJSON</th>
              <th>Tipo Lugar</th>
              <th>Campus</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLugares.map((lugar, idx) => (
              <tr key={lugar.id_ubicacion_geografica + '-' + idx}>
                <td>{lugar.id_lugar}</td>
                <td>{lugar.nombre_lugar}</td>
                <td>{lugar.nombre_tipo_geojson}</td>
                <td>{lugar.nombre_tipo_lugar}</td>
                <td>{lugar.nombre_campus}</td>
                <td>
                  <div style={{ display: 'inline-flex', gap: '8px' }}>
                    <Link
                      href={`/admin/places/view/${lugar.id_lugar}`}
                      passHref
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        textDecoration: 'none',
                        borderBottom: 'none'
                      }}
                      aria-label="Ver"
                      title="Ver detalles"
                    >
                      <i className="uc-icon" style={{ fontSize: 22, color: '#00AA00' }}>description</i>
                    </Link>
                    <Link
                      href={`/admin/places/editar/${lugar.id_lugar}?tab=tab-02`}
                      passHref
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        textDecoration: 'none',
                        borderBottom: 'none'
                      }}
                      aria-label="Editar"
                      title="Editar Lugar"
                    >
                      <i className="uc-icon" style={{ fontSize: 22, color: '#0176DE' }}>edit</i>
                    </Link>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      aria-label="Eliminar"
                      title="Eliminar Lugar"
                      onClick={() => { setDeleteTarget(lugar); setModalOpen(true); }}
                    >
                      <i className="uc-icon" style={{ fontSize: 22, color: '#F24F4F' }}>delete</i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* UC Pagination */}
      {totalPages > 1 && (
        <nav className="uc-pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '24px 0' }}>
          <button
            className="uc-pagination_prev mr-12"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
            aria-label="Anterior"
          >
            <i className="uc-icon">keyboard_arrow_left</i>
          </button>
          <ul className="uc-pagination_pages" style={{ display: 'flex', alignItems: 'center', gap: '4px', listStyle: 'none', margin: 0, padding: 0 }}>
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
          </ul>
          <button
            className="uc-pagination_next ml-12"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
            aria-label="Siguiente"
          >
            <i className="uc-icon">keyboard_arrow_right</i>
          </button>
        </nav>
      )}

      {modal}

      {/* Add styles for desktop and mobile views */}
      <style jsx>{`
        .filters-container {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .filter-input {
          width: 100%;
          height: var(--combobox-height, 40px); // Copia la altura de los combo boxes
          padding: var(--combobox-padding, 0.5rem); // Copia el padding de los combo boxes
          box-sizing: border-box; // Asegura que el input ocupe todo el ancho disponible
          border: var(--combobox-border, 1px solid #ccc); // Copia el estilo de borde de los combo boxes
          border-radius: var(--combobox-border-radius, 4px); // Copia el borde redondeado de los combo boxes
        }

        .combo-boxes {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
          margin-bottom: 1rem;
        }

        .filter-combobox {
          width: 100%;
          box-sizing: border-box;
        }

        .clear-filters-button {
          align-self: flex-end; /* Posicionado completamente a la derecha */
          margin-top: 1rem;
        }

        // Ajustar el diseño de la tabla para que tenga scroll solo en móvil
        .results-table {
          width: 100%;
          display: block;
        }

        @media (max-width: 768px) {
          .results-table {
            overflow-x: auto; // Habilitar scroll horizontal en móvil
            max-height: calc(100vh - 150px); // Ajustar altura máxima en móvil
            overflow-y: auto; // Habilitar scroll vertical en móvil
          }
        }

        table {
          width: 100%;
          border-collapse: collapse; // Mantener el estilo de la tabla
        }

        th, td {
          padding: 0.5rem;
          text-align: left;
          border: 1px solid #ccc; // Estilo de borde para las celdas
        }

        @media (max-width: 768px) {
          .filters-container {
            align-items: flex-start;
          }

          .clear-filters-button {
            align-self: flex-end;
            margin-top: 1rem;
          }

          .filter-input {
            width: 100%;
          }

          .combo-boxes {
            flex-direction: column;
          }

          // Asegurar scroll horizontal en móvil
          .results-table {
            overflow-x: auto;
            max-height: calc(100vh - 150px); // Ajustar altura máxima en móvil
            overflow-y: auto; // Asegurar scroll vertical en móvil
          }
        }
      `}</style>
    </div>
  );
}
