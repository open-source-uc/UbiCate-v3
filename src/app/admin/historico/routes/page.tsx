"use client";

import { useEffect, useState } from "react";
import AdminPageContainer from "@/app/components/ui/admin/AdminPageContainer";

interface HistoricoItem {
  id_historico_ruta: number;
  nombre_usuario: string;
  tipo_operacion: string;
  mensaje: string;
  fecha: string;
  nombre_ruta: string | null;
  nombre_campus: string | null;
}

export default function HistoricoRutasPage() {
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [selectedRuta, setSelectedRuta] = useState<string>("");
  const [filterOperacion, setFilterOperacion] = useState("");
  const [filterCampus, setFilterCampus] = useState("");
  const [filterUsuario, setFilterUsuario] = useState("");
  
  // Campus completos de la BD
  const [todosCampus, setTodosCampus] = useState<{id_campus: number, nombre_campus: string}[]>([]);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Todas las operaciones posibles
  const todasOperaciones: string[] = ['Crear', 'Actualizar', 'Eliminar', 'Aprobar', 'Devolver a Construcción'];
  
  // Extraer usuarios únicos del histórico
  const usuarios = Array.from(new Set(historico.map(h => h.nombre_usuario))).filter(Boolean).sort();

  // Filtrado
  const filteredHistorico = historico.filter(h => {
    const matchOperacion = !filterOperacion || h.tipo_operacion === filterOperacion.toUpperCase();
    const matchRuta = selectedRuta ? h.nombre_ruta === selectedRuta : (!search || h.nombre_ruta?.toLowerCase().includes(search.toLowerCase()));
    const matchCampus = !filterCampus || h.nombre_campus === filterCampus;
    const matchUsuario = !filterUsuario || h.nombre_usuario === filterUsuario;
    return matchOperacion && matchRuta && matchCampus && matchUsuario;
  });

  const totalPages = Math.ceil(filteredHistorico.length / pageSize);
  const paginatedHistorico = filteredHistorico.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Autocomplete para rutas
  useEffect(() => {
    if (search.length > 0) {
      const rutasFiltradas = historico.filter(h => {
        const matchOperacion = !filterOperacion || h.tipo_operacion === filterOperacion;
        const matchCampus = !filterCampus || h.nombre_campus === filterCampus;
        return matchOperacion && matchCampus;
      });
      
      const nombresRutas = Array.from(new Set(
        rutasFiltradas
          .map(h => h.nombre_ruta)
          .filter((n): n is string => n !== null && n.toLowerCase().includes(search.toLowerCase()))
      )).sort().slice(0, 8);
      
      setSearchResults(nombresRutas);
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
    fetch("/api/routes/historico")
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
      minute: "2-digit"
    });
  };

  if (loading) return <AdminPageContainer title="Histórico de Rutas"><p>Cargando histórico...</p></AdminPageContainer>;
  if (error) return <AdminPageContainer title="Histórico de Rutas"><p style={{ color: "#EF4444" }}>Error: {error}</p></AdminPageContainer>;

  return (
    <AdminPageContainer title="Historial de Cambios de Rutas">
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
                  Buscar Ruta
                </label>
                <input
                  id="searchHistorico"
                  type="text"
                  placeholder="Nombre de la ruta..."
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setSelectedRuta("");
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
                          setSelectedRuta(name);
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

            {/* Filtros en línea */}
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
                <label className="uc-label-help" htmlFor="filterOperacion">
                  Tipo de Operación
                  <span className="uc-tooltip" data-tippy-content="Filtra por tipo de operación">
                    <i className="uc-icon">info</i>
                  </span>
                </label>
                <select
                  id="filterOperacion"
                  value={filterOperacion}
                  onChange={e => {
                    setFilterOperacion(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="uc-input-style"
                >
                  <option value="">Todas las operaciones</option>
                  {todasOperaciones.map(op => (
                    <option key={op} value={op.toUpperCase()}>{op}</option>
                  ))}
                </select>
              </div>

              <div className="uc-form-group" style={{ flex: "1 1 30%", minWidth: "180px", maxWidth: "300px", position: "relative", top: "20px" }}>
                <label className="uc-label-help" htmlFor="filterCampus">
                  Campus
                  <span className="uc-tooltip" data-tippy-content="Filtra por campus">
                    <i className="uc-icon">info</i>
                  </span>
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
                  {todosCampus.map((c, idx) => (
                    <option key={c.id_campus + '-' + idx} value={c.nombre_campus}>{c.nombre_campus}</option>
                  ))}
                </select>
              </div>

              <div className="uc-form-group" style={{ flex: "1 1 30%", minWidth: "180px", maxWidth: "300px", position: "relative", top: "20px" }}>
                <label className="uc-label-help" htmlFor="filterUsuario">
                  Usuario
                  <span className="uc-tooltip" data-tippy-content="Filtra por usuario">
                    <i className="uc-icon">info</i>
                  </span>
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
              setSelectedRuta("");
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
                  <th style={{ width: "150px" }}>Ruta</th>
                  <th style={{ width: "150px" }}>Campus</th>
                  <th>Mensaje</th>
                  <th style={{ width: "180px" }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
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

                    {/* Ruta */}
                    <td>
                      {item.nombre_ruta ? (
                        <span style={{ color: "#374151", fontWeight: 500 }}>
                          {item.nombre_ruta}
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
            {/* Páginas intermedias */}
            {totalPages > 1 && currentPage > 3 && totalPages > 5 && (
              <li className="page-item"><a href="#" className="page-link" onClick={e => e.preventDefault()}>...</a></li>
            )}
            {totalPages > 1 && Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => page !== 1 && page !== totalPages && Math.abs(page - currentPage) <= 1)
              .map((page, idx) => (
                <li key={page + '-' + idx} className={`page-item${currentPage === page ? ' active' : ''}`}>
                  <a href="#" className="page-link" onClick={e => { e.preventDefault(); setCurrentPage(page); }}>{page}</a>
                </li>
              ))}
            {totalPages > 1 && currentPage < totalPages - 2 && totalPages > 5 && (
              <li className="page-item"><a href="#" className="page-link" onClick={e => e.preventDefault()}>...</a></li>
            )}
            {/* Última página */}
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
          marginTop: "24px",
          padding: "20px",
          background: "#F9FAFB",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          <h4 style={{ margin: 0, color: "#374151", fontSize: "16px", fontWeight: 600 }}>
            Estadísticas
          </h4>
          <div style={{ 
            display: "flex", 
            gap: "24px", 
            flexWrap: "wrap",
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
                "DEVOLVER A CONSTRUCCIÓN": historico.filter(h => h.tipo_operacion === 'DEVOLVER A CONSTRUCCIÓN').length,
              };
              
              return (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="material-icons" style={{ fontSize: "16px", color: "#6B7280" }}>timeline</span>
                    <span><strong>{historico.length}</strong> registros totales</span>
                  </div>
                  {stats.CREAR > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="material-icons" style={{ fontSize: "16px", color: "#10B981" }}>add_circle</span>
                      <span><strong>{stats.CREAR}</strong> {stats.CREAR === 1 ? 'Creación' : 'Creaciones'}</span>
                    </div>
                  )}
                  {stats.ACTUALIZAR > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="material-icons" style={{ fontSize: "16px", color: "#3B82F6" }}>edit</span>
                      <span><strong>{stats.ACTUALIZAR}</strong> {stats.ACTUALIZAR === 1 ? 'Actualización' : 'Actualizaciones'}</span>
                    </div>
                  )}
                  {stats.APROBAR > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="material-icons" style={{ fontSize: "16px", color: "#059669" }}>check_circle</span>
                      <span><strong>{stats.APROBAR}</strong> {stats.APROBAR === 1 ? 'Aprobación' : 'Aprobaciones'}</span>
                    </div>
                  )}
                  {stats["DEVOLVER A CONSTRUCCIÓN"] > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="material-icons" style={{ fontSize: "16px", color: "#FEC60D" }}>construction</span>
                      <span><strong>{stats["DEVOLVER A CONSTRUCCIÓN"]}</strong> {stats["DEVOLVER A CONSTRUCCIÓN"] === 1 ? 'Devolución a Construcción' : 'Devoluciones a Construcción'}</span>
                    </div>
                  )}
                  {stats.RECHAZAR > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="material-icons" style={{ fontSize: "16px", color: "#F97316" }}>cancel</span>
                      <span><strong>{stats.RECHAZAR}</strong> {stats.RECHAZAR === 1 ? 'Rechazo' : 'Rechazos'}</span>
                    </div>
                  )}
                  {stats.ELIMINAR > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="material-icons" style={{ fontSize: "16px", color: "#EF4444" }}>delete</span>
                      <span><strong>{stats.ELIMINAR}</strong> {stats.ELIMINAR === 1 ? 'Eliminación' : 'Eliminaciones'}</span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Estilos */}
        <style jsx>{`
          .filters-container {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 1rem;
          }

          .clear-filters-button {
            align-self: flex-end;
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
        `}</style>
      </div>
    </AdminPageContainer>
  );
}
