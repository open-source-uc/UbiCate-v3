"use client";

import { useEffect, useState } from "react";
import AdminPageContainer from "@/app/components/ui/admin/AdminPageContainer";

interface HistoricoItem {
  id_historico_ubicacion: number;
  nombre_usuario: string;
  tipo_operacion: string;
  mensaje: string;
  fecha: string;
  nombre_lugar: string | null;
  nombre_campus: string | null;
}

export default function HistoricoPage() {
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [selectedLugar, setSelectedLugar] = useState<string>("");
  const [filterOperacion, setFilterOperacion] = useState("");
  const [filterCampus, setFilterCampus] = useState("");
  const [filterUsuario, setFilterUsuario] = useState("");
  
  // Campus completos de la BD
  const [todosCampus, setTodosCampus] = useState<{id_campus: number, nombre_campus: string}[]>([]);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Todas las operaciones posibles (no solo las que existen en el histórico)
  const todasOperaciones: string[] = ['Crear', 'Actualizar', 'Eliminar', 'Aprobar', 'Devolver a Construcción'];
  
  // Extraer usuarios únicos del histórico
  const usuarios = Array.from(new Set(historico.map(h => h.nombre_usuario))).filter(Boolean).sort();

  // Filtrado
  const filteredHistorico = historico.filter(h => {
    const matchOperacion = !filterOperacion || h.tipo_operacion === filterOperacion.toUpperCase();
    const matchLugar = selectedLugar ? h.nombre_lugar === selectedLugar : (!search || h.nombre_lugar?.toLowerCase().includes(search.toLowerCase()));
    const matchCampus = !filterCampus || h.nombre_campus === filterCampus;
    const matchUsuario = !filterUsuario || h.nombre_usuario === filterUsuario;
    return matchOperacion && matchLugar && matchCampus && matchUsuario;
  });

  const totalPages = Math.ceil(filteredHistorico.length / pageSize);
  const paginatedHistorico = filteredHistorico.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Autocomplete para lugares
  useEffect(() => {
    if (search.length > 0) {
      const lugaresFiltrados = historico.filter(h => {
        const matchOperacion = !filterOperacion || h.tipo_operacion === filterOperacion;
        const matchCampus = !filterCampus || h.nombre_campus === filterCampus;
        return matchOperacion && matchCampus;
      });
      
      const nombresLugares = Array.from(new Set(
        lugaresFiltrados
          .map(h => h.nombre_lugar)
          .filter((n): n is string => n !== null && n.toLowerCase().includes(search.toLowerCase()))
      )).sort().slice(0, 8);
      
      setSearchResults(nombresLugares);
    } else {
      setSearchResults([]);
    }
  }, [search, filterOperacion, filterCampus, historico]);

  // Cargar todos los campus desde la BD
  useEffect(() => {
    fetch("/api/getCampus")
      .then((res) => res.json())
      .then((data) => setTodosCampus(data))
      .catch((err) => console.error("Error cargando campus:", err));
  }, []);

  useEffect(() => {
    fetch("/api/places/historico")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar histórico");
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setHistorico(data.data);
        } else {
          setError(data.error || "Error desconocido");
        }
      })
      .catch((err) => {
        console.error("Error cargando histórico:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const getOperacionColor = (operacion: string) => {
    const colores: Record<string, string> = {
      CREAR: "#10B981",      // Verde
      ACTUALIZAR: "#3B82F6", // Azul
      ELIMINAR: "#EF4444",   // Rojo
      APROBAR: "#059669",    // Verde oscuro
      RECHAZAR: "#F97316",   // Naranja
      "DEVOLVER A CONSTRUCCIÓN": "#FEC60D" // Amarillo (mismo color del icono construction)
    };
    return colores[operacion] || "#6B7280";
  };

  const getOperacionIcon = (operacion: string) => {
    const iconos: Record<string, string> = {
      CREAR: "add_circle",
      ACTUALIZAR: "edit",
      ELIMINAR: "delete",
      APROBAR: "check_circle",
      RECHAZAR: "cancel",
      "DEVOLVER A CONSTRUCCIÓN": "construction"
    };
    return iconos[operacion] || "info";
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Santiago"
    });
  };

  if (loading) return <AdminPageContainer title="Histórico de Cambios"><p>Cargando histórico...</p></AdminPageContainer>;
  if (error) return <AdminPageContainer title="Histórico de Cambios"><p style={{ color: "#EF4444" }}>Error: {error}</p></AdminPageContainer>;

  return (
    <AdminPageContainer title="Historial de Cambios de Lugares">
      <div style={{ overflowX: "auto" }}>
        {/* Filtros y búsqueda */}
        <div className="mb-24">
          <form
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginBottom: "24px",
              background: "#fff",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
            onSubmit={e => e.preventDefault()}
          >
            {/* Input de búsqueda con autocomplete */}
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
                  minWidth: "320px",
                  maxWidth: "600px",
                  position: "relative",
                }}
              >
                <label htmlFor="searchHistorico" className="uc-form-label">
                  Buscar Lugar
                </label>
                <input
                  id="searchHistorico"
                  type="text"
                  placeholder="Nombre del lugar..."
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setSelectedLugar("");
                    setCurrentPage(1);
                  }}
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
                      listStyle: "none",
                    }}
                  >
                    {searchResults.map((nombre) => (
                      <li
                        key={nombre}
                        style={{
                          padding: "10px 16px",
                          cursor: "pointer",
                          borderBottom: "1px solid #f0f0f0",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f3f4f6";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#fff";
                        }}
                        onClick={() => {
                          setSelectedLugar(nombre);
                          setSearch(nombre);
                          setSearchResults([]);
                          setCurrentPage(1);
                        }}
                      >
                        {nombre}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Filtros de operación y campus */}
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
                <label htmlFor="filterOp" className="uc-form-label">
                  Tipo de Operación
                </label>
                <select
                  id="filterOp"
                  value={filterOperacion}
                  onChange={e => {
                    setFilterOperacion(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="uc-input-style"
                >
                  <option value="">Todas las Operaciones</option>
                  {todasOperaciones.map(op => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
              </div>

              <div className="uc-form-group" style={{ flex: "1 1 30%", minWidth: "180px", maxWidth: "300px", position: "relative", top: "20px" }}>
                <label htmlFor="filterCampus" className="uc-form-label">
                  Campus
                </label>
                <select
                  id="filterCampus"
                  value={filterCampus}
                  onChange={e => {
                    setFilterCampus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="uc-input-style"
                >
                  <option value="">Todos los campus</option>
                  {todosCampus.map(campus => (
                    <option key={campus.id_campus} value={campus.nombre_campus}>{campus.nombre_campus}</option>
                  ))}
                </select>
              </div>

              <div className="uc-form-group" style={{ flex: "1 1 30%", minWidth: "180px", maxWidth: "300px", position: "relative", top: "20px" }}>
                <label htmlFor="filterUsuario" className="uc-form-label">
                  Usuario
                </label>
                <select
                  id="filterUsuario"
                  value={filterUsuario}
                  onChange={e => {
                    setFilterUsuario(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="uc-input-style"
                >
                  <option value="">Todos los usuarios</option>
                  {usuarios.map(usuario => (
                    <option key={usuario} value={usuario}>{usuario}</option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Botón de limpiar filtros */}
        <div className="filters-container">
          <button
            type="button"
            className="uc-btn btn-secondary clear-filters-button"
            onClick={() => {
              setSearch("");
              setSelectedLugar("");
              setSearchResults([]);
              setFilterOperacion("");
              setFilterCampus("");
              setFilterUsuario("");
              setCurrentPage(1);
            }}
          >
            Limpiar filtros
          </button>
        </div>

        {/* Tabla de histórico */}
        <div className="results-table">
          {filteredHistorico.length === 0 ? (
            <p style={{ textAlign: "center", padding: "48px", color: "#6B7280" }}>
              No hay registros en el histórico
            </p>
          ) : (
            <table className="uc-table" style={{ width: "100%", marginBottom: "24px" }}>
              <thead>
                <tr>
                  <th style={{ width: "50px", textAlign: "center" }}>Tipo</th>
                  <th style={{ width: "180px" }}>Usuario</th>
                  <th style={{ width: "150px" }}>Lugar</th>
                  <th style={{ width: "150px" }}>Campus</th>
                  <th>Mensaje</th>
                  <th style={{ width: "180px" }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
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

                    {/* Lugar */}
                    <td>
                      {item.nombre_lugar ? (
                        <span style={{ color: "#374151", fontWeight: 500 }}>
                          {item.nombre_lugar}
                        </span>
                      ) : (
                        <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>Sin datos</span>
                      )}
                    </td>

                    {/* Campus */}
                    <td>
                      {item.nombre_campus ? (
                        <span style={{ color: "#374151" }}>
                          {item.nombre_campus}
                        </span>
                      ) : (
                        <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>Sin datos</span>
                      )}
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
                {/* Filas vacías para completar siempre 15 espacios */}
                {Array.from({ length: Math.max(0, pageSize - paginatedHistorico.length) }).map((_, index) => (
                  <tr key={`empty-${index}`} style={{ height: "60px" }}>
                    <td colSpan={6} style={{ borderBottom: "1px solid #E5E7EB" }}>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
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
            {/* Primera página */}
            <li className={`page-item${currentPage === 1 ? ' active' : ''}`}>
              <a href="#" className="page-link" onClick={e => { e.preventDefault(); setCurrentPage(1); }}>1</a>
            </li>

            {totalPages > 1 && currentPage > 3 && totalPages > 5 && (
              <li className="page-item disabled"><span className="page-link">…</span></li>
            )}

            {totalPages > 1 && Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => page !== 1 && page !== totalPages && Math.abs(page - currentPage) <= 1)
              .map((page) => (
                <li key={page} className={`page-item${currentPage === page ? ' active' : ''}`}>
                  <a href="#" className="page-link" onClick={e => { e.preventDefault(); setCurrentPage(page); }}>{page}</a>
                </li>
              ))}

            {totalPages > 1 && currentPage < totalPages - 2 && totalPages > 5 && (
              <li className="page-item disabled"><span className="page-link">…</span></li>
            )}

            {totalPages > 1 && (
              <li className={`page-item${currentPage === totalPages ? ' active' : ''}`}>
                <a href="#" className="page-link" onClick={e => { e.preventDefault(); setCurrentPage(totalPages); }}>{totalPages}</a>
              </li>
            )}
          </ul>
          <button
            className="uc-pagination_next ml-12"
            disabled={currentPage === totalPages || totalPages <= 1}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            aria-label="Siguiente"
          >
            <i className="uc-icon">keyboard_arrow_right</i>
          </button>
        </nav>

        {/* Estadísticas */}
        <div style={{
          background: "#F3F4F6",
          padding: "16px 24px",
          borderRadius: "8px",
          marginTop: "24px",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div>
            <strong>Total de registros:</strong> {filteredHistorico.length}
          </div>
          <div>
            <strong>Mostrando:</strong> {paginatedHistorico.length} de {filteredHistorico.length}
          </div>
        </div>

        {/* Estilos */}
        <style jsx>{`
          .filters-container {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            margin-bottom: 1rem;
          }

          .clear-filters-button {
            align-self: flex-end;
            margin-top: 1rem;
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

          @media (max-width: 768px) {
            .filters-container {
              align-items: flex-start;
            }

            .clear-filters-button {
              align-self: flex-end;
              margin-top: 1rem;
            }

            .results-table {
              overflow-x: auto;
              max-height: calc(100vh - 150px);
              overflow-y: auto;
            }
          }
        `}</style>
      </div>
    </AdminPageContainer>
  );
}
