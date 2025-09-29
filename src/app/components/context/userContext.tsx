"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type UserData = {
  rut: string;
  dv: string;
  nombres: string;
  primerApellido: string;
  segundoApellido: string;
  nombreUsuario: string;
  roles: string[];
} | null;

type UserContextType = {
  user: UserData;
  setUser: (data: UserData) => void;
  clearUser: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserData>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // 🔹 Cargar desde sessionStorage solo en el cliente
  useEffect(() => {
    const stored = sessionStorage.getItem("userData");
    if (stored) {
      setUserState(JSON.parse(stored));
    }
    setMounted(true);
  }, []);

  // 🔹 Guardar en sessionStorage cuando cambie el user
  const setUser = (data: UserData) => {
    setUserState(data);
    if (data) {
      sessionStorage.setItem("userData", JSON.stringify(data));
    } else {
      sessionStorage.removeItem("userData");
    }
  };

  const clearUser = () => {
    setUserState(null);
    sessionStorage.removeItem("userData");
  };

  // 🔹 Limpiar datos al cambiar de página
  useEffect(() => {
    if (!pathname.startsWith("/admin/users")) {
      clearUser();
    }
  }, [pathname]);

  if (!mounted) return null; // ⬅️ evita renderizar en SSR

  return (
    <UserContext.Provider value={{ user, setUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser debe usarse dentro de UserProvider");
  return ctx;
}
