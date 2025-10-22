import React from "react";
import "./LoadingModal.css";

export default function LoadingModal({ open, text = "Cargando..." }: { open: boolean; text?: string }) {
  if (!open) return null;
  return (
    <div className="loading-modal-overlay">
      <div className="loading-modal-box">
        <div className="loading-spinner" />
        <span>{text}</span>
      </div>
    </div>
  );
}
