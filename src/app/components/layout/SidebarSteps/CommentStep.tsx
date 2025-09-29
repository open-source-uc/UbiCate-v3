"use client";

import type { StepProps } from "@/app/types/stepProps";
import { StepTagAttributes } from "@/app/types/stepTagAttributes";
import "../../ui/css/Form.css";
import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import tippy, { Instance } from "tippy.js";
import "tippy.js/dist/tippy.css";
import { useSidebar } from "../../context/SidebarContext";

type CommentStepProps = StepProps & {
  onClose?: () => void;
};

export default function CommentStep() {
  const [submitting, setSubmitting] = useState(false);
  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [modalMessage, setModalMessage] = useState(
    "¡Gracias! Su sugerencia fue enviada con éxito y será revisada a la brevedad."
  );
  const { clearQueryParams } = useSidebar();


  // merge className de StepTagAttributes + suggest-step (para scroll mobile)
  const stepAttrs = useMemo(() => {
    const cls = (StepTagAttributes as { className?: string })?.className ?? "";
    return { ...StepTagAttributes, className: `${cls} comment-step`.trim() };
  }, []);

  // bloquear scroll del body SOLO cuando el modal esté abierto
  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modalOpen]);


  // ✅ Tippy: hover desktop, click mobile
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


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const sugerencia = fd.get("sugerencia") as string;

    const nombres = (fd.get("nombres") as string)?.trim();
    const apellidos = (fd.get("apellidos") as string)?.trim();

    try {
      const res = await fetch("/api/sugerencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          sugerencia,
          nombres,
          apellidos
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Error al guardar");

      setIsSuccess(true);
      setModalMessage("¡Gracias! Su sugerencia fue enviada con éxito y será revisada a la brevedad.");
      setModalOpen(true);
    } catch (err: unknown) {
      setIsSuccess(false);
      setModalMessage(err instanceof Error ? err.message : "No se pudo enviar su sugerencia");
      setModalOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Modal (uc-message)
  const modal = modalOpen
    ? createPortal(
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
                  clearQueryParams();
                }}
              >
                <i className="uc-icon">close</i>
              </a>
              <div className="uc-message_body">
                <h2 className="mb-24">
                  <i className="uc-icon warning-icon">check_circle</i> Mensaje de éxito
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
    )
    : null;

  return (
    <ul {...stepAttrs}>
      <div className="suggest-header">
        <button className="uc-btn btn-featured" onClick={() => clearQueryParams()} type="button">
          Volver
          <i className="uc-icon">arrow_back_ios_new</i>
        </button>
      </div>
      <br />
      <div className="suggest-scroll">
        <div className="form-container">
          <h4>Formulario sugerencia {process.env.NEXT_PUBLIC_APP_TITLE}</h4>
          <br />
          <form onSubmit={handleSubmit}>
            <div className="uc-form-group">
              {/* 1. Email */}
              <label htmlFor="email" className="uc-label-help">
                <span className="uc-label-text">Email</span>
                <span className="uc-tooltip" data-tippy-content="Email de la persona que sugiere">
                  <i className="uc-icon">info</i>
                </span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="uc-input-style"
                required
                placeholder="fabian.nuñez@uc.cl"
              />
            </div>
            {/* 2. Nombre */}
            <div className="uc-form-group">
              <label htmlFor="nombres" className="uc-label-help">
                <span className="uc-label-text">Nombres</span>
                <span className="uc-tooltip" data-tippy-content="Nombres de la persona que sugiere">
                  <i className="uc-icon">info</i>
                </span>
              </label>
              <input
                id="nombres"
                name="nombres"
                type="text"
                className="uc-input-style"
                required
                placeholder="Fabian Benjamín"
              />
            </div>
            {/* 3. Apellidos */}
            <div className="uc-form-group">
              <label htmlFor="apellidos" className="uc-label-help">
                <span className="uc-label-text">Apellidos</span>
                <span className="uc-tooltip" data-tippy-content="Apellidos de la persona que sugiere">
                  <i className="uc-icon">info</i>
                </span>
              </label>
              <input
                id="apellidos"
                name="apellidos"
                type="text"
                className="uc-input-style"
                required
                placeholder="Salzar Núñez"
              />
            </div>
            {/* 4. Sugerencia */}
            <div className="uc-form-group">
              <label htmlFor="sugerencia" className="uc-label-help">
                <span className="uc-label-text">Sugerencia</span>
                <span className="uc-tooltip" data-tippy-content={`Sugerencia del usuario para mejorar ${process.env.NEXT_PUBLIC_APP_TITLE}`}>
                  <i className="uc-icon">info</i>
                </span>
              </label>
              <textarea
                id="sugerencia"
                name="sugerencia"
                className="uc-input-style"
                required
                rows={12}
                placeholder={`¿Podrian agregar un tema oscuro a ${process.env.NEXT_PUBLIC_APP_TITLE}?`}
              />
            </div>
            <button type="submit" className="uc-btn btn-featured" disabled={submitting}>
              {submitting ? " Enviando sugerencia..." : "Enviar sugerencia"}
            </button>
          </form>
        </div>
      </div>

      {modal}
    </ul>
  );
}
