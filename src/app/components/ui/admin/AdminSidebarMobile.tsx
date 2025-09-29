import SideSection from "../sidebar/SideSection";
import SideOption from "../sidebar/SideOption";
import { useEffect } from "react";

type SidebarMobileProps = {
  open: boolean;
  onClose: () => void;
  topOffset: number; // alto de los dos headers móviles
};

export default function SidebarMobileAdmin({ open, onClose, topOffset }: SidebarMobileProps) {
  // lock scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const backdrop: React.CSSProperties = {
    position: "fixed",
    top: topOffset,
    left: 0,
    height: `calc(100vh - ${topOffset}px)`,
    width: "100vw",
    background: "rgba(0,0,0,.35)",
    zIndex: 1048, // debajo de headers (1050)
    opacity: open ? 1 : 0,
    pointerEvents: open ? "auto" : "none",
    transition: "opacity .2s ease",
  };

  const drawer: React.CSSProperties = {
    position: "fixed",
    top: topOffset,
    left: 0,
    height: `calc(100vh - ${topOffset}px)`,
    width: "100vw",
    zIndex: 1049, // debajo de headers (1050)
    overflowY: "auto",
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.3s ease",
    transform: open ? "translateX(0)" : "translateX(-100%)",
  };

  return (
    <>
      <div style={backdrop} onClick={onClose} />
      <div className="uc-navbar_mobile-content" style={drawer}>
        {/* Contenido */}
        <div style={{ padding: "1rem", flex: 1, backgroundColor: "#fff" }}>
          <SideSection title="Gestión" icon="settings">
            <SideOption title="Gestionar Usuarios" href="/admin/users" onClick={onClose} />
            <SideOption title="Gestionar Lugares" href="/admin/places" onClick={onClose} />
            <SideOption title="Gestionar Tipos" href="/admin/places/tipos" onClick={onClose} />
          </SideSection>
        </div>
      </div>
    </>
  );
}
