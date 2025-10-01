"use client";

import { useEffect, useState } from "react";
import UserCard from "@/app/components/ui/admin/UserCard";
import { UsuarioRow } from "@/app/types/usuarioType";
import { useAuth } from "../auth-provider";

import { format } from "rut.js";
import AdminPageContainer from "../../components/ui/admin/AdminPageContainer";

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
      {/* ERROR MODAL OVERLAY */}
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
              <div className="uc-message_content">
                <p>{ucMessage.text}</p>
              </div>
            </div>
          </div>
        </>
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
              background: "rgba(0,0,0,0.3)",
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
              <div style={{ display: "flex", alignItems: "center" }} className="justify-content-between">
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
                  }}
                  style={{
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    width: "200px",
                  }}
                  placeholder="12.345.678-9"
                />
                <div className="row">
                  <div className="col-md-6">
                    <button
                      onClick={() => setShowModal(false)}
                      style={{
                        marginRight: "8px",
                        padding: "8px 16px",
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={async () => {
                        // ADD USER LOGIC HERE - keeping original functionality
                        console.log("Adding user with RUT:", rut);
                        setShowModal(false);
                        setRut("");
                      }}
                      style={{
                        padding: "8px 16px",
                        background: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Buscar
                    </button>
                  </div>
                </div>
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