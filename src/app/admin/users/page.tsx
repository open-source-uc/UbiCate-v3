"use client";

import { useEffect, useState } from "react";
import UserCard from "@/app/components/ui/admin/UserCard";
import { UsuarioRow } from "@/app/types/usuarioType";
import { useAuth } from "../auth-provider";
import { useUser } from "@/app/components/context/userContext";
import { useRouter } from "next/navigation";
import {format} from "rut.js"

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <>{children}</>;
}

export default function Page() {
  const [users, setUsers] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { state } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [rut, setRut] = useState("");
  const [, setUcErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const { setUser } = useUser();

  const [ucMessage, setUcMessage] = useState<{
  type: "error" | "warning" | null;
  text: string | null;
}>(() => ({ type: null, text: null }));


  useEffect(() => {
    fetch("/api/usuario/getAdmins")
      .then((res) => res.json())
      .then((data: UsuarioRow[]) => setUsers(data))
      .catch((err) => console.error("Error al cargar usuarios:", err))
      .finally(() => setLoading(false));
  }, []);

  if (state.kind === "loading") return <p>Cargando sesión...</p>;
  if (state.kind === "denied") return <p>No tienes acceso administrador</p>;

  const { attributes } = state.authUser;

  // ✅ nueva función: elimina el usuario de la lista sin recargar toda la página
  const handleDeleteUser = (id: number) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id_usuario !== id));
  };

  return (
    <div
      style={{
        padding: 30,
        display: "flex",
        flexDirection: "column",
        maxHeight: "100%",
      }}
    >
      {/* OVERLAY SOLO PARA ERRORES */}
      {ucMessage.type && (
  <>
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        zIndex: 9998,
      }}
      onClick={() => setUcMessage({ type: null, text: null })}
    />

    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
        minWidth: "400px",
        maxWidth: "90%",
      }}
    >
      <div
        className={`uc-message ${ucMessage.type}`}
        style={{ position: "relative" }}
      >
        <a
          href="#"
          className="uc-message_close-button"
          onClick={(e) => {
            e.preventDefault();
            setUcMessage({ type: null, text: null });
          }}
        >
          <i className="uc-icon">close</i>
        </a>

        <div className="uc-message_body">
          {ucMessage.type === "error" && (
            <>
              <h2 className="mb-24">
                <i className="uc-icon">error</i> Ha ocurrido un error
              </h2>
              <p className="no-margin">{ucMessage.text}</p>
            </>
          )}

          {ucMessage.type === "warning" && (
            <>
              <h2 className="mb-24">
                <i className="uc-icon warning-icon">warning</i> Rut no existente en la Plataforma Central de Datos
              </h2>
              <p className="no-margin">{ucMessage.text}</p>
              <hr className="uc-hr my-32" />
              <div className="row align-items-center">
                <div className="col-md-6">
                  <a href="https://mesadeserviciosuc.atlassian.net/servicedesk/customer/user/login?destination=portals" className="uc-link uc-btn btn-inline">
                    Contactar Soporte
                  </a>
                </div>
                <div className="col-md-6 text-right">
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  </>
)}
      <h3 className="mobileManageUserTitle">Gestionar Usuarios</h3>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingBottom: "20px",
          alignItems: "center",
        }}
      >
        <h3 className="desktopManageUserTitle">Gestionar Usuarios</h3>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <div
              className="uc-btn btn-secondary"
              style={{ cursor: "pointer" }}
              onClick={() => {
                setShowModal((prev) => !prev);
                setUcErrorMessage(null);
              }}
            >
              <span style={{ paddingRight: "10px", whiteSpace: "nowrap" }}>
                Agregar Usuario
              </span>
              <i className="uc-icon" style={{ fontSize: "30px" }}>
                add
              </i>
            </div>

            <ClientOnly>
              {showModal && (
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    background: "rgba(0,0,0,0.3)", // overlay
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 20,
                  }}
                >
                  <div
                    style={{
                      background: "white",
                      borderRadius: "8px",
                      padding: "16px",
                      width: "90vw",
                      maxWidth: "600px",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                    }}
                  >
                  <div style={{display:"flex", alignItems: "center"}} className="justify-content-between">
                    <label
                        style={{
                          marginRight: "16px",
                          marginBottom: "8px",
                          fontWeight: 600,
                        }}
                    >
                      Rut<span style={{ color: "red" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={rut}
                      onChange={(e) => {
                        setRut(format(e.target.value));
                        setUcErrorMessage(null);
                      }}
                      placeholder="Ingrese RUT del usuario"
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        marginBottom: "12px",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "8px",
                    }}
                  >
                    <button
                      className="uc-btn btn-primary"
                      onClick={() => setShowModal(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      className="uc-btn btn-cta"
                      onClick={async () => {
                        try {
                          const rutClean = rut.replace(/[^0-9kK]/g, "");
                          const res = await fetch(
                            `/api/personaBasico/${rutClean}`
                          );
                          const data = await res.json();

                          if (res.ok) {
                            if (Array.isArray(data?.datos) && data.datos.length === 0) {
                              // ⚠️ Caso advertencia
                              setUcMessage({
                                type: "warning",
                                text:
                                  "El RUT ingresado no se encuentra dentro de la Plataforma Central de Datos.",
                              });
                            } else if (data?.datos) {
                              // ✅ Caso éxito
                              setUser({
                                rut: data.datos.persona.datos_personales.RUT.valor,
                                dv: data.datos.persona.datos_personales.RUT.digito_verificador,
                                nombres: data.datos.persona.datos_personales.nombres,
                                primerApellido: data.datos.persona.datos_personales.primer_apellido,
                                segundoApellido: data.datos.persona.datos_personales.segundo_apellido,
                                nombreUsuario: data.datos.usuario.nombre_usuario,
                                roles: data.datos.usuario.roles_vigentes,
                              });
                              setShowModal(false);
                              router.push("/admin/users/add");
                            } else {
                              // ❌ Caso error lógico
                              setUcMessage({
                                type: "error",
                                text: data?.error?.data?.mensaje || "No se encontró información.",
                              });
                            }
                          } else {
                            // ❌ Caso error HTTP
                            setUcMessage({
                              type: "error",
                              text: "Ocurrió un error en la consulta al servidor.",
                            });
                          }
                        } catch (error) {
                          console.error("Error buscando usuario:", error);
                          setUcErrorMessage(
                            "Ocurrió un error al consultar el usuario. Verifica el RUT e intenta nuevamente."
                          );
                        }
                      }}
                    >
                      Buscar
                    </button>
                  </div>
                </div>
                </div>
              )}
            </ClientOnly>
          </div>
        </div>
      </div>

      <div style={{ width: "100%", paddingBottom: "20px" }}>
        <input
          id="ucsearch3"
          type="text"
          className="uc-input-style w-icon search"
          placeholder="Buscar por"
        />
      </div>

      <div
        style={{
          maxHeight: "100%",
          paddingRight: "5px",
          overflowY: "auto",
        }}
      >
        {loading ? (
          <p>Cargando usuarios...</p>
        ) : users.length === 0 ? (
          <p>No hay usuarios registrados</p>
        ) : (
          users
            .filter((user) => user.uid !== attributes.uid)
            .map((user) => (
              <UserCard
                key={user.id_usuario}
                user={user}
                onDelete={handleDeleteUser}
              />
            ))
        )}
      </div>
    </div>
  );
}
