"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import tippy, { Instance } from "tippy.js";
import "tippy.js/dist/tippy.css";
import { PlaceName } from "@/app/types/placeNameType";
import AdminPageContainer from "../../../../components/ui/admin/AdminPageContainer";

const AddTipoPage: React.FC = () => {
  const [newTipo, setNewTipo] = useState({ nombre: "", icono: "", color: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const router = useRouter();

  const handleAddTipo = async () => {
    if (!newTipo.nombre.trim() || !newTipo.icono.trim() || !newTipo.color.trim()) {
      console.error("Todos los campos son obligatorios");
      setErrorMessage("Todos los campos son obligatorios");
      return;
    }
    try {
      const payload: Omit<PlaceName, "id_tipo_lugar"> = {
        nombre_tipo_lugar: newTipo.nombre,
        icono: newTipo.icono,
        color_icono: newTipo.color,
      };
      console.log("Payload being sent to API:", payload); // Log the payload for debugging

      const response = await fetch("/api/places/insertTipo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setNewTipo({ nombre: "", icono: "", color: "" }); // Reset form fields
        setErrorMessage("");
        setIsSuccess(true);
        setModalMessage("¡Tipo de lugar creado con éxito!");
        setModalOpen(true);
      } else {
        const errorData = await response.json();
        console.error("Error al añadir tipo:", errorData);
        setIsSuccess(false);
        setModalMessage(errorData.message || "Error al añadir tipo");
        setModalOpen(true);
      }
    } catch (error) {
      console.error("Error al añadir tipo:", error);
      setIsSuccess(false);
      setModalMessage("Error al añadir tipo. Por favor, intente nuevamente.");
      setModalOpen(true);
    }
  };

  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modalOpen]);

  useEffect(() => {
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
  }, []);

  return (
    <AdminPageContainer title="Añadir Tipo de Lugar">
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      <div className="uc-form-group" style={{ marginBottom: "1rem" }}>
        <label htmlFor="newTipo" className="uc-label-help">
          <span className="uc-label-text">Nombre</span>
          <span className="uc-tooltip" data-tippy-content="Es el nombre del tipo de lugar">
            <i className="uc-icon">info</i>
          </span>
        </label>
        <input
          id="newTipo"
          type="text"
          className="uc-input-style"
          value={newTipo.nombre}
          onChange={(e) => setNewTipo({ ...newTipo, nombre: e.target.value })}
          placeholder="Nombre"
        />
      </div>

      <div className="uc-form-group" style={{ marginBottom: "2rem" }}>
        <label htmlFor="icono" className="uc-label-help">
          <span className="uc-label-text">Ícono</span>
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <input
            id="icono"
            name="icono"
            type="text"
            className="uc-input-style"
            value={newTipo.icono}
            onChange={(e) => setNewTipo({ ...newTipo, icono: e.target.value })}
            required
            placeholder="Ejemplo: library"
          />
          <i className="uc-icon" style={{ color: newTipo.color, fontSize: "24px" }}>
            {newTipo.icono}
          </i>
        </div>
        <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#666", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <i className="uc-icon" style={{ color: "#0078D4", fontSize: "24px" }}>info</i>
          <span>Puedes consultar la lista de íconos disponibles en <a href="https://fonts.google.com/icons" target="_blank" rel="noopener noreferrer">Google Fonts Icons</a>.</span>
        </div>
      </div>

      <div className="uc-form-group" style={{ marginBottom: "1.5rem" }}>
        <label htmlFor="newColor" className="uc-label-help">
          <span className="uc-label-text">Color</span>
          <span className="uc-tooltip" data-tippy-content="Seleccione un color para el ícono">
            <i className="uc-icon">info</i>
          </span>
        </label>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <input
              id="newColor"
              type="color"
              className="uc-input-style"
              value={newTipo.color}
              onChange={(e) => setNewTipo({ ...newTipo, color: e.target.value })}
            />
            <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Color Picker</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <input
              id="newColorHex"
              type="text"
              className="uc-input-style"
              value={newTipo.color}
              onChange={(e) => {
                const hexValue = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
                setNewTipo({ ...newTipo, color: hexValue });
              }}
              placeholder="#HEX"
              style={{ width: "100px" }}
            />
            <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Hexadecimal</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
        <button className="uc-btn btn-featured" onClick={handleAddTipo}>
          Añadir Tipo
        </button>
        <button
          type="button"
          className="uc-btn btn-secondary"
          style={{ backgroundColor: "#F24F4F", color: "white" }}
          onClick={() => router.push("/admin/places/tipos")}
        >
          Cancelar
        </button>
      </div>
      </div>

      {/* Modal */}
      {modalOpen && createPortal(
        <div className="uc-modal-overlay" role="dialog" aria-modal="true">
          <div style={{ width: "90%", maxWidth: 520 }}>
            {isSuccess ? (
              <div className="uc-message success mb-32">
                <a
                  href="#"
                  className="uc-message_close-button"
                  onClick={(e) => {
                    e.preventDefault();
                    setModalOpen(false);
                    router.push("/admin/places/tipos");
                  }}
                >
                  <i className="uc-icon">close</i>
                </a>
                <div className="uc-message_body">
                  <h2 className="mb-24">
                    <i className="uc-icon warning-icon">check_circle</i> Tipo creado con éxito
                  </h2>
                  <p className="no-margin">{modalMessage}</p>
                </div>
              </div>
            ) : (
              <div className="uc-message error mb-32">
                <a
                  href="#"
                  className="uc-message_close-button"
                  onClick={(e) => {
                    e.preventDefault();
                    setModalOpen(false);
                  }}
                >
                  <i className="uc-icon">close</i>
                </a>
                <div className="uc-message_body">
                  <h2 className="mb-24">
                    <i className="uc-icon warning-icon">error</i> Ha ocurrido un error
                  </h2>
                  <p className="no-margin">{modalMessage}</p>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </AdminPageContainer>
  );
};

export default AddTipoPage;