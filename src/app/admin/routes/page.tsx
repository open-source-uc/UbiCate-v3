"use client";
import React, { useEffect, useState } from "react";
import tippy, { Instance } from "tippy.js";
import "tippy.js/dist/tippy.css";
import axios from "axios";
import { useRouter } from "next/navigation";
import { RouteWithGeo } from "@/app/types/routeType";

type Ruta = {
    id_ruta: number;
    nombre_ruta: string;
    nombre_campus: string;
    descripcion: string;
    placeIds: number[];
    isEmpty?: boolean;
    key?: string;
};

const RoutesTable: React.FC = () => {
    const [rutas, setRutas] = useState<Ruta[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Ruta | null>(null);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorModalMessage, setErrorModalMessage] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 15;
    const router = useRouter();

    useEffect(() => {
        fetchRutas();
    }, []);

    // Reset to first page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const fetchRutas = async () => {
        setLoading(true);
        try {
            const response = await axios.get("/api/getRoutes");
            const rutasData = response.data.map((route: RouteWithGeo) => ({
                id_ruta: route.id_ruta,
                nombre_ruta: route.nombre_ruta,
                nombre_campus: route.nombre_campus,
                descripcion: route.descripcion,
                placeIds: route.placeIds || []
            }));
            setRutas(rutasData);
        } catch (error) {
            console.error("Error al cargar las rutas:", error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            // TODO: Implementar API para eliminar rutas
            console.log("Eliminar ruta:", deleteTarget.id_ruta);
            setShowDeleteModal(false);
            setDeleteTarget(null);
            // fetchRutas(); // Reload after delete
        } catch (error) {
            console.error("Error eliminando ruta:", error);
            setShowDeleteModal(false);
            setDeleteTarget(null);
            setErrorModalMessage("Error interno del servidor");
            setShowErrorModal(true);
        }
    };

    const filteredRutas = rutas.filter((ruta) =>
        ruta.nombre_ruta?.toLowerCase().includes(search.trim().toLowerCase() || "")
    );

    // Calculate total pages based on filtered data
    const totalPages = Math.ceil(filteredRutas.length / pageSize);
    
    // Get paginated filtered data
    const paginatedFilteredRutas = filteredRutas.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    
    // Create empty rows to fill the page
    const emptyRowsNeeded = Math.max(0, pageSize - paginatedFilteredRutas.length);
    const emptyRows = Array.from({ length: emptyRowsNeeded }, (_, index) => ({
        id_ruta: 0,
        nombre_ruta: "",
        nombre_campus: "",
        descripcion: "",
        placeIds: [],
        isEmpty: true,
        key: `empty-${currentPage}-${index}`
    }));

    // Combine filtered data with empty rows
    const displayRows = [...paginatedFilteredRutas, ...emptyRows];

    console.log("Display Rows:", displayRows); // Debugging line to check display rows

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="container">
            <h3 className="mobileManageUserTitle">Gestión de Rutas</h3>

            <div style={{ paddingBottom: "20px" }}>
                <h3 className="desktopManageUserTitle">Gestión de Rutas</h3>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                    <a href="/admin/routes/add" className="uc-btn btn-secondary">
                        <i className="uc-icon">add</i>
                    </a>
                </div>
            </div>

            <div className="filters-column" style={{ marginBottom: "2rem" }}>
                <div className="uc-form-group" style={{ maxWidth: "360px", margin: "0 auto" }}>
                    <label className="uc-label-help" htmlFor="ucsearch">
                        Buscar ruta
                        <span className="uc-tooltip" data-tippy-content="Buscador por nombre de la ruta">
                            <i className="uc-icon">info</i>
                        </span>
                    </label>
                    <input
                        id="ucsearch"
                        type="text"
                        className="uc-input-style"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Nombre"
                    />
                </div>
            </div>

            <div className="results-table">
                <table className="uc-table" style={{ width: "100%", marginBottom: "24px" }}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Campus</th>
                            <th>Lugares</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayRows.map((ruta, index) => (
                            <tr key={ruta.key || ruta.id_ruta || `row-${index}`} className={index % 2 === 0 ? "active" : ""}>
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
                                    {!ruta.isEmpty && ruta.id_ruta && (
                                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                                            <button
                                                onClick={() => {
                                                    router.push(`/admin/routes/view/${ruta.id_ruta}`);
                                                }}
                                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                                title="Ver detalles"
                                            >
                                                <i className="uc-icon" style={{ fontSize: 22, color: '#28a745' }}>description</i>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    router.push(`/admin/routes/editar/${ruta.id_ruta}`);
                                                }}
                                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                                title="Editar"
                                            >
                                                <i className="uc-icon" style={{ fontSize: 22, color: '#0176DE' }}>edit</i>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setDeleteTarget(ruta);
                                                    setShowDeleteModal(true);
                                                }}
                                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                                title="Eliminar"
                                            >
                                                <i className="uc-icon" style={{ fontSize: 22, color: '#F24F4F' }}>delete</i>
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
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        aria-label="Siguiente"
                    >
                        <i className="uc-icon">keyboard_arrow_right</i>
                    </button>
                </nav>
            )}

            {showDeleteModal && (
                <div className="uc-modal-overlay" role="dialog" aria-modal="true">
                    <div style={{ width: "90%", minWidth: 380, maxWidth: 600 }}>
                        <div className="uc-message error mb-32">
                            <a
                                href="#"
                                className="uc-message_close-button"
                                onClick={(e) => { e.preventDefault(); setShowDeleteModal(false); setDeleteTarget(null); }}
                            >
                                <i className="uc-icon">close</i>
                            </a>
                            <div className="uc-message_body">
                                <h2 className="mb-24">
                                    <i className="uc-icon warning-icon">error</i> Confirmar eliminación
                                </h2>
                                <p className="no-margin">¿Estás seguro de que deseas eliminar la ruta <strong>{deleteTarget?.nombre_ruta}</strong>?</p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: 24 }}>
                                    <a
                                        href="#"
                                        className="uc-btn btn-secondary text-center"
                                        style={{ backgroundColor: '#00AA00', color: 'white' }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleDelete();
                                        }}
                                    >
                                        Sí, eliminar
                                    </a>
                                    <button className="uc-btn btn-secondary text-center" onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}>No, cancelar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showErrorModal && (
                <div className="uc-modal-overlay" role="dialog" aria-modal="true">
                    <div style={{ width: "90%", minWidth: 380, maxWidth: 600 }}>
                        <div className="uc-message error mb-32">
                            <a
                                href="#"
                                className="uc-message_close-button"
                                onClick={(e) => { e.preventDefault(); setShowErrorModal(false); setErrorModalMessage(""); }}
                            >
                                <i className="uc-icon">close</i>
                            </a>
                            <div className="uc-message_body">
                                <h2 className="mb-24">
                                    <i className="uc-icon warning-icon">error</i> Error
                                </h2>
                                <p className="no-margin">{errorModalMessage}</p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: 24 }}>
                                    <button className="uc-btn btn-secondary text-center" style={{ backgroundColor: '#0176DE', color: 'white' }} onClick={() => setShowErrorModal(false)}>Aceptar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
};

export default RoutesTable;
