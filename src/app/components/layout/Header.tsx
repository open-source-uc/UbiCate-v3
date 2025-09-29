"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import SidebarMobile from "./SidebarMobile";
import SidebarMobileAdmin from "../ui/admin/AdminSidebarMobile";
import { useAuth } from "../../admin/auth-provider";
import "../ui/css/Header.css";

const MOBILE_TOPBAR = 56;
const MOBILE_SUB = 60;
const MOBILE_TOTAL = MOBILE_TOPBAR + MOBILE_SUB;

type MobileDropdownPortalProps = {
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
};

function MobileDropdownPortal({ anchorRef, children, open, onClose }: MobileDropdownPortalProps) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;

    const update = () => {
      const r = anchorRef.current!.getBoundingClientRect();
      setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef]);

  if (!open || !pos) return null;

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "transparent", zIndex: 20000 }}
      />
      <div
        style={{
          position: "fixed",
          top: pos.top,
          right: pos.right,
          zIndex: 20001,
        }}
      >
        {children}
      </div>
    </>,
    document.body
  );
}

type HeaderProps = {
  isAdmin?: boolean;
};

export default function Header({ isAdmin = false }: HeaderProps) {
  const [openSidebar, setOpenSidebar] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openMobileModal, setOpenMobileModal] = useState(false);

  const avatarRef = useRef<HTMLDivElement>(null);
  const avatarRefMobile = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const auth = useAuth();
  const uid = auth.state.kind === "ready" ? auth.state.authUser.attributes.uid : "";
  const initials = auth.initials ?? "??";
  const logout = auth.logout;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        openModal &&
        modalRef.current &&
        avatarRef.current &&
        !modalRef.current.contains(e.target as Node) &&
        !avatarRef.current.contains(e.target as Node)
      ) {
        setOpenModal(false);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenModal(false);
        setOpenMobileModal(false);
        setOpenSidebar(false);
      }
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [openModal]);

  return (
    <header className="uc-header">
      {/* Desktop */}
      <nav className="uc-navbar navbar-dark uc-navbar-system d-none d-lg-block">
        <div className="container-fluid mb-12">
          <div className="row align-items-center justify-content-between">
            <div className="col-auto d-flex align-items-center">
              <Link href="/" className="d-inline-block"
            onClick={ () => { window.dispatchEvent(new CustomEvent("ui:set-step", { detail: { step: "MainStep" } })); window.dispatchEvent(new Event("sidebar:open")); }}
               >
                  <Image
                    src="https://kit-digital-uc-prod.s3.amazonaws.com/assets/uc_sm.svg"
                    alt="UC"
                    className="img-fluid"
                    style={{ maxWidth: "110px", height: "auto" }}
                    width={36}
                    height={20}
                  />
              </Link>

              <Link
                  href="/"
                  className="h3 text-font--serif color-white d-none d-xl-inline-block"
            onClick={ () => { window.dispatchEvent(new CustomEvent("ui:set-step", { detail: { step: "MainStep" } })); window.dispatchEvent(new Event("sidebar:open")); }}
                  style={{ textDecoration: "none", marginLeft: "1rem", fontSize: "1.35rem", lineHeight: 1.1 }}
              >
                {process.env.NEXT_PUBLIC_APP_TITLE}
              </Link>
            </div>

            {isAdmin && (
              <div
                className="col-auto d-none d-xl-flex align-items-center ms-auto"
                style={{ position: "relative" }}
                ref={avatarRef}
              >
                <div
                  className="avatar avatar--circle avatar--s avatar--yellow"
                  aria-haspopup="dialog"
                  aria-expanded={openModal}
                  tabIndex={0}
                  onClick={() => setOpenModal((v) => !v)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpenModal((v) => !v)}
                  style={{ cursor: "pointer", userSelect: "none" }}
                  title={uid}
                >
                  <div className="avatar--initials">{initials}</div>
                </div>

                {openModal && (
                  <div
                    ref={modalRef}
                    style={{ position: "absolute", top: "calc(100% + 8px)", right: 8, zIndex: 20001 }}
                  >
                    <div className="mobile-avatar-dropdown">
                      <div className="uid-chip" title={uid}>{uid || "—"}</div>
                      <hr className="uid-sep" />
                      <button type="button" onClick={logout} className="uid-logout">
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile */}
      <div className="d-block d-lg-none">
        <div className="fixed-top uc-mobile-topstack">
          <div className="uc-mobile-topbar">
            <Link href="/" 
            style={{ outline: "none" }}
            onClick={ () => { window.dispatchEvent(new CustomEvent("ui:set-step", { detail: { step: "MainStep" } })); window.dispatchEvent(new Event("sidebar:open")); }}
            className="d-inline-flex align-items-center">
              <Image
                src="https://kit-digital-uc-prod.s3.amazonaws.com/assets/uc_sm.svg"
                alt="UC"
                width={98}
                height={52}
                style={{ height: 26, width: "auto" }}
              />
            </Link>
          </div>

          <div className="uc-mobile-subheader" style={{ gap: 32, position: "relative" }}>
            <Link
              href="/"
            onClick={ () => { window.dispatchEvent(new CustomEvent("ui:set-step", { detail: { step: "MainStep" } })); window.dispatchEvent(new Event("sidebar:open")); }}
              className="h3 text-font--serif color-white mb-0"
              style={{ textDecoration: "none", outline: "none" }}
            >
              {process.env.NEXT_PUBLIC_APP_TITLE}
            </Link>

            <div className="d-flex align-items-center" style={{ gap: 16, paddingRight: 8 }}>
              {isAdmin && (
                <div
                  ref={avatarRefMobile}
                  className="avatar avatar--circle avatar--s avatar--yellow"
                  aria-haspopup="dialog"
                  aria-expanded={openMobileModal}
                  tabIndex={0}
                  onClick={() => setOpenMobileModal((v) => !v)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpenMobileModal((v) => !v)}
                  style={{ cursor: "pointer", userSelect: "none" }}
                  title={uid}
                >
                  <div className="avatar--initials">{initials}</div>
                </div>
              )}

              <button
                type="button"
                className="uc-navbar_mobile-button"
                data-open={openSidebar}
                aria-label={openSidebar ? "Cerrar menú" : "Abrir menú"}
                onClick={(e) => {
                  setOpenSidebar((v) => !v);
                  e.currentTarget.blur();
                }}
              >
                <span className="uc-burger" aria-hidden="true"></span>
              </button>
            </div>
          </div>
        </div>

        {isAdmin && (
          <MobileDropdownPortal
            anchorRef={avatarRefMobile}
            open={openMobileModal}
            onClose={() => setOpenMobileModal(false)}
          >
            <div className="mobile-avatar-dropdown">
              <div className="uid-chip" title={uid}>{uid || "—"}</div>
              <hr className="uid-sep" />
              <button type="button" onClick={logout} className="uid-logout">
                Cerrar sesión
              </button>
            </div>
          </MobileDropdownPortal>
        )}

        {isAdmin ? (
          <SidebarMobileAdmin open={openSidebar} onClose={() => setOpenSidebar(false)} topOffset={MOBILE_TOTAL} />
        ) : (
          <SidebarMobile open={openSidebar} onClose={() => setOpenSidebar(false)} topOffset={MOBILE_TOTAL} setOpen={setOpenSidebar} />
        )}
      </div>
    </header>
  );
}
