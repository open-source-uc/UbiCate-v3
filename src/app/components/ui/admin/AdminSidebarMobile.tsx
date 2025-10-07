'use client';

import SideSection from "../sidebar/SideSection";
import SideOption from "../sidebar/SideOption";
import { useEffect } from "react";

type SidebarMobileProps = {
  open: boolean;
  onClose: () => void;
  topOffset: number;
};

export default function SidebarMobileAdmin({ open, onClose, topOffset }: SidebarMobileProps) {
  // Lock scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (!open || (typeof window === 'undefined' || window.innerWidth >= 992)) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const drawerStyle: React.CSSProperties = {
    position: 'fixed',
    top: topOffset,
    left: 0,
    height: `calc(100vh - ${topOffset}px)`,
    width: '100vw',
    zIndex: 1049,
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',             
    transition: 'transform 0.3s ease',
    transform: open ? 'translateX(0)' : 'translateX(-100%)',
  };

  const backdrop: React.CSSProperties = {
    position: 'fixed',
    top: topOffset,
    left: 0,
    height: `calc(100vh - ${topOffset}px)`,
    width: '100vw',
    background: 'rgba(0,0,0,.35)',
    zIndex: 1048,
    opacity: open ? 1 : 0,
    pointerEvents: open ? 'auto' : 'none',
    transition: 'opacity .2s ease',
  };

  return (
    <>
      <div style={backdrop} onClick={onClose} />
      <div className="uc-navbar_mobile-content" style={drawerStyle}>
        <div style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
          <ul
            className="nav uc-navbar-side uc-navbar-side-fit py-40"
            suppressHydrationWarning
            style={{ 
              overflowY: "auto", 
              padding: "20px 10px",
              display: "flex",
              flexDirection: "column"
            }}
          >
            <SideSection title="Gestión" icon="settings">
              <SideOption title="Gestionar Usuarios" href="/admin/users" onClick={onClose} icon="group" iconColor="#0176DE"/>
              <SideOption title="Gestionar Lugares" href="/admin/places" onClick={onClose} icon="place" iconColor="#0176DE"/>
              <SideOption title="Gestionar Tipos de Lugares" href="/admin/places/tipos" onClick={onClose} icon="category" iconColor="#0176DE"/>
              <SideOption title="Gestionar Rutas" href="/admin/routes" onClick={onClose} icon="route" iconColor="#0176DE"/>
            </SideSection>
            <SideSection title="Auditoría" icon="history">
              <SideOption title="Historial de Cambios de Lugares" href="/admin/historico/places" onClick={onClose} icon="timeline" iconColor="#0176DE"/>
              <SideOption title="Historial de Cambios de Rutas" href="/admin/historico/routes" onClick={onClose} icon="timeline" iconColor="#0176DE"/>
            </SideSection>
          </ul>
        </div>
      </div>
    </>
  );
}
