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

    const totalPages = Math.ceil(filteredTipos.length / pageSize);
    const paginatedTipos = filteredTipos.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    console.log("Filtered Tipos:", paginatedTipos); // Debugging line to check filteredTipos content

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <a href="/admin/places/tipos/add" className="uc-btn btn-secondary">
                    <i className="uc-icon">add</i>
                </a>
            </div>

            <div className="filters-column">
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

            <div className="table-column">
                <table className="uc-table results-table">
                    <caption>Tipos de Lugar</caption>
                    <thead>
                        <tr>
                            <th scope="col" style={{ width: "120px" }}>ID</th>
                            <th scope="col">Nombre</th>
                            <th scope="col">Ícono</th>
                            <th scope="col">Color</th>
                            <th scope="col" style={{ width: "150px", textAlign: "center" }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedTipos.map((tipo, index) => (
                            <tr key={tipo.id_tipo_lugar || `empty-${index}`} className={tipo.id_tipo_lugar % 2 === 0 ? "active" : ""}>
                                <td>{tipo.id_tipo_lugar || ""}</td>
                                <td>{tipo.nombre_tipo_lugar || (
                                    <span style={{ color: "transparent" }}>Texto invisible</span>
                                )}</td>
                                <td>
                                    <i className="uc-icon" style={{ color: tipo.color_icono }}>{tipo.icono}</i>
                                </td>
                                <td>
                                    <span
                                        style={{
                                            display: "inline-block",
                                            width: "20px",
                                            height: "20px",
                                            backgroundColor: tipo.color_icono,
                                            borderRadius: "50%",
                                        }}
                                    ></span>
                                </td>
                                <td>
                                    {tipo.id_tipo_lugar && (
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
                                <button
                                    className="page-link"
                                    onClick={() => setCurrentPage(page)}
                                    style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                                >
                                    {page}
                                </button>
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
                    height: 100vh;
                    padding: 16px; /* Add padding to the container */
                    background-color: #f9f9f9;
                }

                .results-table {
                    width: calc(100% - 32px); /* Add horizontal spacing */
                    height: calc(100% - 32px); /* Add vertical spacing */
                    margin: 16px; /* Ensure spacing around the table */
                    border-collapse: collapse;
                    background: #fff;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                .results-table tbody tr {
                    height: 60px; /* Fija la altura de cada fila */
                }

                .results-table tbody tr td {
                    vertical-align: middle; /* Asegura que el contenido esté centrado verticalmente */
                }

                .uc-pagination {
                    margin-top: auto;
                    padding: 8px 0;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    background-color: #f9f9f9;
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