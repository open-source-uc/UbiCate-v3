"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMap } from "./MapContext";

interface SidebarContextProps {
  isOpen: boolean;
  step: string;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  setQueryParam: (name: string, value: string) => void;
  clearQueryParams: () => void;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [step, setStep] = useState("MainStep");
  const { flyToCampus, campusData } = useMap();

  const router = useRouter();
  const pathname = usePathname();

  // manejamos los params manualmente
  const [params, setParams] = useState<URLSearchParams>(
    () => (typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams())
  );

  // cada vez que cambia la ruta/URL, actualizamos el estado
  useEffect(() => {
    const update = () => setParams(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);

  const toggleSidebar = () => setIsOpen((prev) => !prev);
  const openSidebar = () => {
    window.dispatchEvent(new Event("sidebar:open"));
  }
  const closeSidebar = () => {
    window.dispatchEvent(new Event("sidebar:close"));
  };

  const clearQueryParams = () => {
    router.replace(pathname);
    setParams(new URLSearchParams());
  };

  function setQueryParam(name: string, value: string, clear: boolean = true) {
    const next = new URLSearchParams(clear ? "" : params.toString());
    next.set(name, value);
    router.push(`${pathname}?${next.toString()}`);
    setParams(next);
  }

  useEffect(() => {
    const campus = params.get("campus");
    const menu = params.get("menu");

    if (!campus && !menu) return setStep("MainStep");
    if (menu && menu !== "PlacesStep") setStep(menu);

    if (campus && !isNaN(Number(campus))) {
      if (!campusData.find((_campus) => _campus.id_campus == Number(campus))) return setStep("MainStep");
      flyToCampus(Number(campus));
      setStep("PlacesStep");
    }
  }, [params, campusData]);

  return (
    <SidebarContext.Provider
      value={{ isOpen, toggleSidebar, openSidebar, closeSidebar, setQueryParam, step, clearQueryParams }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};
