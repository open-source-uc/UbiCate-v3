'use client';

// import { useMap } from '../context/MapContext';
import { useEffect } from 'react';
import SidebarSteps from './SidebarSteps/SidebarSteps';

type SidebarMobileProps = {
  open: boolean;
  onClose: () => void;
  setOpen: (value: boolean) => void;
  topOffset: number;
};

export default function SidebarMobile({ open, onClose, topOffset, setOpen }: SidebarMobileProps) {
  // Lock scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (!open || (typeof window === 'undefined' || window.innerWidth >= 992)) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    const onOpen  = () => setOpen(true);
    const onClose = () => setOpen(false);
    window.addEventListener('sidebar:open', onOpen as EventListener);
    window.addEventListener('sidebar:close', onClose as EventListener);
    return () => {
      window.removeEventListener('sidebar:open', onOpen as EventListener);
      window.removeEventListener('sidebar:close', onClose as EventListener);
    };
  }, []);

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
          <SidebarSteps onClose={onClose}/>
        </div>
      </div>
    </>
  );
}
