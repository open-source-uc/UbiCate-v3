"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import tippy, { Instance } from "tippy.js";
import "tippy.js/dist/tippy.css";
import { PlaceName } from "@/app/types/placeNameType";

const AddTipoPage: React.FC = () => {
  const [newTipo, setNewTipo] = useState({ nombre: "", icono: "", color: "" });
  const [errorMessage, setErrorMessage] = useState("");
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
        router.push("/admin/places/tipos");
      } else {
        const errorData = await response.json();
        console.error("Error al añadir tipo:", errorData);
        setErrorMessage(errorData.message || "Error al añadir tipo");
      }
    } catch (error) {
      console.error("Error al añadir tipo:", error);
      setErrorMessage("Error al añadir tipo. Por favor, intente nuevamente.");
    }
  };

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
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Añadir Tipo</h1>
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

      <div className="uc-form-group" style={{ marginBottom: "1rem" }}>
        <label htmlFor="newIcono" className="uc-label-help">
          <span className="uc-label-text">Ícono</span>
          <span className="uc-tooltip" data-tippy-content="Es el ícono que representa el tipo de lugar">
            <i className="uc-icon">info</i>
          </span>
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <input
            id="newIcono"
            type="text"
            className="uc-input-style"
            value={newTipo.icono}
            onChange={(e) => setNewTipo({ ...newTipo, icono: e.target.value })}
            placeholder="Ícono"
          />
          <i className="uc-icon" style={{ color: newTipo.color, fontSize: "24px" }}>
            {newTipo.icono}
          </i>
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
  );
};

export default AddTipoPage;