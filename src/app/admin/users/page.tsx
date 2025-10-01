"use client";

import { useEffect, useState } from "react";
import UserCard from "@/app/components/ui/admin/UserCard";
import { UsuarioRow } from "@/app/types/usuarioType";
import { useAuth } from "../auth-provider";

import { format } from "rut.js";
import AdminPageContainer from "../../components/ui/admin/AdminPageContainer";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/components/context/userContext";

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
  const [ucMessage, setUcMessage] = useState<{
    type: "error" | "warning" | null;
    text: string | null;
  }>({ type: null, text: null });
  const router = useRouter();
  const { setUser } = useUser();


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

  const handleDeleteUser = (id: number) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id_usuario !== id));
  };

  const actionButton = (
    <a 
      href="#"
      className="uc-btn btn-secondary"
      onClick={(e) => {
        e.preventDefault();
        setShowModal((prev) => !prev);
        setUcMessage({ type: null, text: null });
      }}
    >
      <span style={{ paddingRight: "10px", whiteSpace: "nowrap" }}>
        Agregar Usuario
      </span>
      <i className="uc-icon">add</i>
    </a>
  );

  return (
    <>
      {/* ERROR MODAL OVERLAY - Estilo SuggestStep */}
      {ucMessage.type && (
        <div className="uc-modal-overlay" role="dialog" aria-modal="true">
          <div style={{ width: "90%", maxWidth: 520 }}>
            <div className={`uc-message ${ucMessage.type} mb-32`}>
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
                <h2 className="mb-24">
                  <i className="uc-icon warning-icon">
                    {ucMessage.type === "error" ? "error" : "warning"}
                  </i>
                  {ucMessage.type === "error" ? " Ha ocurrido un error" : " RUT no encontrado"}
                </h2>
                <p className="no-margin">{ucMessage.text}</p>
                {ucMessage.type === "warning" && (
                  <>
                    <hr className="uc-hr my-32" />
                    <div className="row align-items-center">
                      <div className="col-md-6">
                        <a 
                          href="https://mesadeserviciosuc.atlassian.net/servicedesk/customer/user/login?destination=portals" 
                          className="uc-link uc-btn btn-inline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Contactar Soporte
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      <ClientOnly>
        {showModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
            onClick={() => setShowModal(false)}
          >
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "32px",
                width: "90vw",
                maxWidth: "500px",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
                border: "1px solid #e5e7eb",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginBottom: "24px"
              }}>
                <h2 style={{ 
                  margin: 0, 
                  color: "#0176DE", 
                  fontSize: "1.5rem",
                  fontWeight: "600"
                }}>
                  Agregar Usuario
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6b7280",
                    fontSize: "20px"
                  }}
                  title="Cerrar"
                >
                  <i className="uc-icon">close</i>
                </button>
              </div>

              {/* Form */}
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                    color: "#374151"
                  }}
                >
                  RUT del usuario <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={rut}
                  onChange={(e) => {
                    setRut(format(e.target.value));
                  }}
                  className="uc-input-style"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: "16px",
                    border: "2px solid #d1d5db",
                    borderRadius: "8px",
                    outline: "none",
                    transition: "border-color 0.2s"
                  }}
                  placeholder="Ej: 12.345.678-9"
                  onFocus={(e) => e.target.style.borderColor = "#0176DE"}
                  onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                />
                <p style={{ 
                  margin: "8px 0 0 0", 
                  fontSize: "14px", 
                  color: "#6b7280" 
                }}>
                  Ingresa el RUT del usuario que deseas agregar como administrador
                </p>
              </div>

              {/* Buttons */}
              <div style={{ 
                display: "flex", 
                gap: "12px", 
                justifyContent: "flex-end" 
              }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "12px 24px",
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "14px",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = "#e5e7eb"}
                  onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = "#f3f4f6"}
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    try {
                      const rutClean = rut.replace(/[^0-9kK]/g, "");
                      const res = await fetch(`/api/personaBasico/${rutClean}`);
                      const data = await res.json();

                      if (res.ok) {
                        if (Array.isArray(data?.datos) && data.datos.length === 0) {
                          // Caso advertencia
                          setUcMessage({
                            type: "warning",
                            text: "El RUT ingresado no se encuentra dentro de la Plataforma Central de Datos.",
                          });
                        } else if (data?.datos) {
                          // Caso éxito
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
                          setRut("");
                          router.push("/admin/users/add");
                        } else {
                          // Caso error lógico
                          setUcMessage({
                            type: "error",
                            text: data?.error?.data?.mensaje || "No se encontró información.",
                          });
                        }
                      } else {
                        // Caso error HTTP
                        setUcMessage({
                          type: "error",
                          text: "Ocurrió un error en la consulta al servidor.",
                        });
                      }
                    } catch (error) {
                      console.error("Error buscando usuario:", error);
                      setUcMessage({
                        type: "error",
                        text: "Ocurrió un error al consultar el usuario. Verifica el RUT e intenta nuevamente."
                      });
                    }
                  }}
                  style={{
                    padding: "12px 24px",
                    background: "#0176DE",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "14px",
                    transition: "background-color 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                  onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = "#0056b3"}
                  onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = "#0176DE"}
                  disabled={!rut.trim()}
                >
                  <i className="uc-icon" style={{ fontSize: "16px", color: "white" }}>search</i>
                  Buscar Usuario
                </button>
              </div>
            </div>
          </div>
        )}
      </ClientOnly>

      <AdminPageContainer title="Gestión de Usuarios" actionButton={actionButton}>
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
      </AdminPageContainer>
    </>
  );
}