"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import tippy, { Instance } from "tippy.js";
import "tippy.js/dist/tippy.css";

const EditarTipoPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  const [tipo, setTipo] = useState({
    nombre_tipo_lugar: "",
    icono: "",
    color_icono: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`/api/places/getTypeById?id=${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setTipo(data);
          }
          setLoading(false);
        })
        .catch(() => {
          setError("No se pudo cargar el tipo");
          setLoading(false);
        });
    }
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTipo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/places/editTipo/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tipo),
      });
      if (!response.ok) throw new Error("Error al guardar");

      router.push(`/admin/places/tipos`); // Redirigir sin considerar la paginación
    } catch (error) {
      console.error("Error durante submit:", error);
      setError("Error al guardar los cambios");
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: "0 1.5rem" }}>
      <div className="form-container" style={{ padding: "2rem" }}>
        <h4 style={{ marginBottom: "2rem" }}>Editar Tipo</h4>
        <form onSubmit={handleSubmit}>
          <div className="uc-form-group" style={{ marginBottom: "2rem" }}>
            <label htmlFor="nombre_tipo_lugar" className="uc-label-help">
              <span className="uc-label-text">Nombre del tipo</span>
              <span className="uc-tooltip" data-tippy-content="Es el nombre del tipo de lugar">
                <i className="uc-icon">info</i>
              </span>
            </label>
            <input
              id="nombre_tipo_lugar"
              name="nombre_tipo_lugar"
              type="text"
              className="uc-input-style"
              value={tipo.nombre_tipo_lugar}
              onChange={handleChange}
              required
              placeholder="Ejemplo: Biblioteca"
            />
          </div>

          <div className="uc-form-group" style={{ marginBottom: "2rem" }}>
            <label htmlFor="icono" className="uc-label-help">
              <span className="uc-label-text">Ícono</span>
              <span className="uc-tooltip" data-tippy-content="Es el ícono que representa el tipo de lugar">
                <i className="uc-icon">info</i>
              </span>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <input
                id="icono"
                name="icono"
                type="text"
                className="uc-input-style"
                value={tipo.icono}
                onChange={handleChange}
                required
                placeholder="Ejemplo: library"
              />
              <i className="uc-icon" style={{ color: tipo.color_icono, fontSize: "24px" }}>
                {tipo.icono}
              </i>
            </div>
          </div>

          <div className="uc-form-group" style={{ marginBottom: "2rem" }}>
            <label htmlFor="color_icono" className="uc-label-help">
              <span className="uc-label-text">Color</span>
              <span className="uc-tooltip" data-tippy-content="Seleccione un color para el ícono">
                <i className="uc-icon">info</i>
              </span>
            </label>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <input
                  id="color_icono"
                  name="color_icono"
                  type="color"
                  className="uc-input-style"
                  value={tipo.color_icono}
                  onChange={handleChange}
                  required
                />
                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Color Picker</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <input
                  id="color_icono_hex"
                  name="color_icono"
                  type="text"
                  className="uc-input-style"
                  value={tipo.color_icono}
                  onChange={handleChange}
                  placeholder="#HEX"
                  style={{ width: "100px" }}
                />
                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Hexadecimal</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "3rem" }}>
            <button type="submit" className="uc-btn btn-featured" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              className="uc-btn btn-secondary"
              style={{ backgroundColor: "#F24F4F", color: "white" }}
              onClick={() => router.push(`/admin/places/tipos`)} // Redirigir sin considerar la paginación
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* Modal de confirmación estilo SuggestStep */}
      {showConfirmModal && (
        <div className="uc-modal-overlay" role="dialog" aria-modal="true">
          <div style={{ width: "90%", maxWidth: 520 }}>
            <div className="uc-message warning mb-32">
              <a
                href="#"
                className="uc-message_close-button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowConfirmModal(false);
                }}
              >
                <i className="uc-icon">close</i>
              </a>
              <div className="uc-message_body">
                <h2 className="mb-24">
                  <i className="uc-icon warning-icon">help</i> Confirmar cambios
                </h2>
                <p className="no-margin">¿Estás seguro de que deseas guardar los cambios realizados en este tipo de lugar?</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: 24 }}>
                  <a 
                    href="#" 
                    className="uc-btn btn-secondary text-center" 
                    style={{ backgroundColor: '#00AA00', color: 'white' }}
                    onClick={(e) => {
                      e.preventDefault();
                      if (!submitting) handleConfirmSave();
                    }}
                  >
                    Sí, guardar cambios
                  </a>
                  <button 
                    className="uc-btn btn-secondary" 
                    onClick={() => setShowConfirmModal(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditarTipoPage;
