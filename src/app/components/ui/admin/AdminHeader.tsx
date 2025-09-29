'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../admin/auth-provider';
import SidebarMobileAdmin from './AdminSidebarMobile';

// CSS
import '../css/admin-header-shared.css';
import '../css/admin-header-mobile.css';
import '../css/admin-header-desktop.css';

const MOBILE_TOPBAR = 56; // UC (azul claro)
const MOBILE_SUB = 60;    // Título + avatar + burger (azul oscuro)
const MOBILE_TOTAL = MOBILE_TOPBAR + MOBILE_SUB;

/* ---------- Portal para dropdown móvil del avatar ---------- */
function MobileDropdownPortal({
  anchorRef,
  children,
  open,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
}) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const update = () => {
      const r = anchorRef.current!.getBoundingClientRect();
      setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, anchorRef]);

  if (!open || !pos) return null;

  return createPortal(
    <>
      {/* backdrop para cerrar tocando fuera */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'transparent', zIndex: 20000 }}
      />
      <div style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 20001 }}>
        {children}
      </div>
    </>,
    document.body
  );
}

/* ------------------------ Header Admin ------------------------ */
export default function AdminHeader() {
  const { state, initials, logout } = useAuth();
  const uid = state.kind === 'ready' ? state.authUser.attributes.uid : '';

  // Desktop dropdown
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Mobile dropdown
  const [openMobile, setOpenMobile] = useState(false);
  const avatarRefMobile = useRef<HTMLDivElement>(null);

  // Mobile sidebar
  const [showSidebar, setShowSidebar] = useState(false);

  // Click outside + ESC (desktop & mobile)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        open &&
        modalRef.current &&
        avatarRef.current &&
        !modalRef.current.contains(t) &&
        !avatarRef.current.contains(t)
      ) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setOpenMobile(false);
        setShowSidebar(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className="uc-header admin-header">
      <nav className="uc-navbar navbar-dark uc-navbar-system">
        {/* ===== DESKTOP (≥ lg) ===== */}
        <div className="container-fluid mb-12 d-none d-lg-block">
          <div className="row align-items-center justify-content-between">
            {/* Left cluster: logo + título */}
            <div className="col-auto d-flex align-items-center admin-header-left">
              <Link href="/" className="d-inline-block">
                <Image
                  src="https://kit-digital-uc-prod.s3.amazonaws.com/assets/uc_sm.svg"
                  alt="UC"
                  className="img-fluid"
                  style={{ maxWidth: '156px' }}
                  width={49}
                  height={26}
                />
              </Link>

              <Link
                href="/"
                className="admin-header-title h3 text-font--serif color-white d-none d-xl-inline-block"
                style={{ textDecoration: 'none' }}
              >
                Localizate
              </Link>
            </div>

            {/* Right cluster: avatar desktop */}
            <div
              className="col-auto d-none d-xl-flex align-items-center ms-auto"
              style={{ position: 'relative', overflow: 'visible' }}
              ref={avatarRef}
            >
              <div
                className="avatar avatar--circle avatar--s avatar--yellow"
                aria-haspopup="dialog"
                aria-expanded={open}
                tabIndex={0}
                onClick={() => setOpen(v => !v)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpen(v => !v)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title={uid}
              >
                <div className="avatar--initials">{initials || '??'}</div>
              </div>

              {open && (
                <div
                  ref={modalRef}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 8,
                    zIndex: 20001,
                  }}
                >
                  {/* Misma UI que mobile */}
                  <div className="mobile-avatar-dropdown">
                    <div className="uid-chip" title={uid}>{uid || '—'}</div>
                    <hr className="uid-sep" />
                    <button type="button" onClick={logout} className="uid-logout">
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== MOBILE (< lg) ===== */}
        <div className="d-block d-lg-none">
          {/* Doble barra fija */}
          <div className="fixed-top uc-mobile-topstack">
            {/* Barra UC (azul claro) */}
            <div className="uc-mobile-topbar">
              <Link href="/" className="d-inline-flex align-items-center">
                <Image
                  src="https://kit-digital-uc-prod.s3.amazonaws.com/assets/uc_sm.svg"
                  alt="UC"
                  width={98}
                  height={52}
                  style={{ height: 26, width: 'auto' }}
                />
              </Link>
            </div>

            {/* Barra título + avatar + burger (azul oscuro) */}
            <div className="uc-mobile-subheader" style={{ gap: 32, position: 'relative' }}>
              <Link
                href="/"
                className="h3 text-font--serif color-white mb-0"
                style={{ textDecoration: 'none' }}
              >
                Localizate
              </Link>

              <div className="d-flex align-items-center" style={{ gap: 16, paddingRight: 8 }}>
                {/* ✅ Avatar móvil ANCLADO dentro del subheader */}
                <div
                  ref={avatarRefMobile}
                  className="avatar avatar--circle avatar--s avatar--yellow"
                  aria-haspopup="dialog"
                  aria-expanded={openMobile}
                  tabIndex={0}
                  onClick={() => setOpenMobile(v => !v)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpenMobile(v => !v)}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title={uid}
                >
                  <div className="avatar--initials">{initials || '??'}</div>
                </div>

                {/* Burger */}
                <button
                  type="button"
                  className="uc-navbar_mobile-button"
                  data-open={showSidebar}
                  aria-label={showSidebar ? 'Cerrar menú' : 'Abrir menú'}
                  onClick={(e) => {
                    setShowSidebar(v => !v);
                    (e.currentTarget as HTMLButtonElement).blur();
                  }}
                  style={{ marginLeft: 8 }}
                >
                  <span className="uc-burger" aria-hidden="true"></span>
                </button>
              </div>
            </div>
          </div>

          {/* Dropdown del avatar en Portal (encima de todo) */}
          <MobileDropdownPortal
            anchorRef={avatarRefMobile}
            open={openMobile}
            onClose={() => setOpenMobile(false)}
          >
            <div className="mobile-avatar-dropdown">
              <div className="uid-chip" title={uid}>{uid || '—'}</div>
              <hr className="uid-sep" />
              <button type="button" onClick={logout} className="uid-logout">
                Cerrar sesión
              </button>
            </div>
          </MobileDropdownPortal>

          {/* Drawer debajo de las barras */}
          <SidebarMobileAdmin
            open={showSidebar}
            onClose={() => setShowSidebar(false)}
            topOffset={MOBILE_TOTAL}
          />
        </div>
      </nav>
    </header>
  );
}
