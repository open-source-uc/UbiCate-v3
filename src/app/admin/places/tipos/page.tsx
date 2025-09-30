"use client";
import React, { useEffect, useState } from "react";
import tippy, { Instance } from "tippy.js";
import "tippy.js/dist/tippy.css";
import axios from "axios";
import { useRouter } from "next/navigation";

type Tipo = {
    id_tipo_lugar: number;
    nombre_tipo_lugar: string;
    icono: string;
    color_icono: string;
    isEmpty?: boolean;
    key?: string;
};

const TiposTable: React.FC = () => {
    const [tipos, setTipos] = useState<Tipo[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Tipo | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editTarget, setEditTarget] = useState<Tipo | null>(null);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorModalMessage, setErrorModalMessage] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 15;
    const router = useRouter();

    useEffect(() => {
        fetchTipos();
    }, []);

    // Reset to first page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const fetchTipos = async () => {
        setLoading(true);
        try {
            const response = await axios.get("/api/places/getTypes");
            setTipos(response.data);
        } catch (error) {
            console.error("Error al cargar los tipos de lugar:", error);
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

    const handleEditTipo = () => {
        if (!editTarget) {
            console.error("Edit target is not set.");
            return;
        }
        console.log("Navigating to edit page:", { editTarget });
        router.push(`/admin/places/tipos/editar/${editTarget.id_tipo_lugar}`);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            const response = await fetch(`/api/places/deleteTipo/${deleteTarget.id_tipo_lugar}`, {
                method: "DELETE",
            });
            const result = await response.json();
            if (response.ok) {
                setTipos((prev) => prev.filter((tipo) => tipo.id_tipo_lugar !== deleteTarget.id_tipo_lugar));
                fetchTipos(); // Reload tipos after delete
                setShowDeleteModal(false);
                setDeleteTarget(null);
            } else {
                // Cerrar el modal de confirmación y abrir el modal de error
                setShowDeleteModal(false);
                setDeleteTarget(null);
                setErrorModalMessage(result.message || "Error al eliminar el tipo de lugar");
                setShowErrorModal(true);
            }
        } catch (error) {
            console.error("Error eliminando tipo de lugar:", error);
            setShowDeleteModal(false);
            setDeleteTarget(null);
            setErrorModalMessage("Error interno del servidor");
            setShowErrorModal(true);
        }
    };

    const filteredTipos = tipos.filter((tipo) =>
        tipo.nombre_tipo_lugar?.toLowerCase().includes(search.trim().toLowerCase() || "")
    );

    // Calculate total pages based on filtered data
    const totalPages = Math.ceil(filteredTipos.length / pageSize);
    
    // Get paginated filtered data
    const paginatedFilteredTipos = filteredTipos.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    
    // Create empty rows to fill the page
    const emptyRowsNeeded = Math.max(0, pageSize - paginatedFilteredTipos.length);
    const emptyRows = Array.from({ length: emptyRowsNeeded }, (_, index) => ({
        id_tipo_lugar: 0,
        nombre_tipo_lugar: "",
        icono: "",
        color_icono: "",
        isEmpty: true,
        key: `empty-${currentPage}-${index}`
    }));

    // Combine filtered data with empty rows
    const displayRows = [...paginatedFilteredTipos, ...emptyRows];

    console.log("Display Rows:", displayRows); // Debugging line to check display rows

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="container">
            <h3 className="mobileManageUserTitle">Gestión de Tipos de Lugar</h3>

            <div style={{ paddingBottom: "20px" }}>
                <h3 className="desktopManageUserTitle">Gestión de Tipos de Lugar</h3>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                    <a href="/admin/places/tipos/add" className="uc-btn btn-secondary">
                        <i className="uc-icon">add</i>
                    </a>
                </div>
            </div>

            <div className="filters-column" style={{ marginBottom: "2rem" }}>
                    <div className="uc-form-group" style={{ maxWidth: "360px", margin: "0 auto" }}>
                        <label className="uc-label-help" htmlFor="ucsearch">
                            Buscar tipo de lugar
                            <span className="uc-tooltip" data-tippy-content="Buscador por nombre del tipo de lugar">
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
                            <th>Ícono</th>
                            <th>Color</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayRows.map((tipo, index) => (
                            <tr key={tipo.key || tipo.id_tipo_lugar || `row-${index}`} className={index % 2 === 0 ? "active" : ""}>
                                <td>{tipo.isEmpty ? "" : tipo.id_tipo_lugar}</td>
                                <td>
                                    {tipo.isEmpty ? (
                                        <span style={{ color: "transparent", userSelect: "none" }}>Texto invisible</span>
                                    ) : (
                                        tipo.nombre_tipo_lugar || (
                                            <span style={{ color: "transparent", userSelect: "none" }}>Texto invisible</span>
                                        )
                                    )}
                                </td>
                                <td>
                                    {!tipo.isEmpty && tipo.icono && (
                                        <i className="uc-icon" style={{ color: tipo.color_icono }}>{tipo.icono}</i>
                                    )}
                                </td>
                                <td>
                                    {!tipo.isEmpty && tipo.color_icono && (
                                        <span
                                            style={{
                                                display: "inline-block",
                                                width: "20px",
                                                height: "20px",
                                                backgroundColor: tipo.color_icono,
                                                borderRadius: "50%",
                                            }}
                                        ></span>
                                    )}
                                </td>
                                <td>
                                    {!tipo.isEmpty && tipo.id_tipo_lugar && (
                                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                                            <button
                                                onClick={() => {
                                                    router.push(`/admin/places/tipos/editar/${tipo.id_tipo_lugar}`);
                                                }}
                                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                            >
                                                <i className="uc-icon" style={{ fontSize: 22, color: '#0176DE' }}>edit</i>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setDeleteTarget(tipo);
                                                    setShowDeleteModal(true);
                                                }}
                                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
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
                    <p className="no-margin">¿Estás seguro de que deseas eliminar el tipo de lugar <strong>{deleteTarget?.nombre_tipo_lugar}</strong>?</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: 24 }}>
                        <button className="uc-btn btn-secondary text-center" style={{ backgroundColor: '#00AA00', color: 'white' }} onClick={handleDelete}>Sí, eliminar</button>
                        <button className="uc-btn btn-secondary text-center" onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}>No, cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
)}

{showEditModal && editTarget && (
    <div className="uc-modal-overlay" role="dialog" aria-modal="true">
        <div style={{ width: "90%", minWidth: 380, maxWidth: 600 }}>
            <div className="uc-message warning mb-32">
                <a
                    href="#"
                    className="uc-message_close-button"
                    onClick={(e) => { e.preventDefault(); setShowEditModal(false); setEditTarget(null); }}
                >
                    <i className="uc-icon">close</i>
                </a>
                <div className="uc-message_body">
                    <h2 className="mb-24">
                        <i className="uc-icon warning-icon">warning</i> Confirmar edición
                    </h2>
                    <p className="no-margin">¿Estás seguro de que deseas editar el tipo de lugar <strong>{editTarget.nombre_tipo_lugar}</strong>?</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: 24 }}>
                        <button className="uc-btn btn-secondary text-center" style={{ backgroundColor: '#00AA00', color: 'white' }} onClick={handleEditTipo}>Sí, editar</button>
                        <button className="uc-btn btn-secondary text-center" onClick={() => { setShowEditModal(false); setEditTarget(null); }}>No, cancelar</button>
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

export default TiposTable;