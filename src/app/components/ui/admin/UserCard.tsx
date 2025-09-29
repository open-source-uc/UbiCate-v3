import { useState } from "react";
import { UsuarioRow } from "@/app/types/usuarioType";

interface UserCardProps {
  user: UsuarioRow;
  onDelete?: (id: number) => void;
}

function getInitials(nombres: string | null, apellidos: string | null) {
  const firstName = (nombres ?? "").trim().split(" ")[0];
  const lastName = (apellidos ?? "").trim().split(" ")[0];
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
}

export default function UserCard({ user, onDelete }: UserCardProps) {
  const initials = getInitials(user.nombres, user.apellidos);
  const [showModal, setShowModal] = useState(false);

  const handleDelete = async () => {
    try {
      const res = await fetch("/api/usuario/deleteAdmins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: user.id_usuario }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onDelete?.(user.id_usuario);
        setShowModal(false);
      } else {
        alert(data.message || "Error al eliminar usuario ❌");
      }
    } catch (err) {
      console.error(err);
      alert("Error al conectar con el servidor ❌");
    }
  };

  return (
    <>
      <div
        className="uc-card card-type--horizontal userCard"
        style={{
          width: "100%",
          minHeight: 100,
          marginBottom: "8px",
          display: "grid",
          gridTemplateColumns: "90px 1fr 100px",
        }}
      >
        {/* Avatar */}
        <div
          className="userCardImg"
          style={{ display: "flex", justifyContent: "right", alignItems: "center" }}
        >
          <div
            className="avatar avatar--circle avatar--xs avatar--yellow"
            title={user.uid ?? undefined}
            style={{
              cursor: "default",
              userSelect: "none",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div className="avatar--initials">{initials || "??"}</div>
          </div>
        </div>

        {/* Datos */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "start",
            flexDirection: "column",
            paddingLeft: 20,
          }}
        >
          <h4 className="userCardTitle">
            {user.nombres} {user.apellidos}
          </h4>
          <h6 style={{ fontSize: "0.9rem", fontWeight: "500" }}>
            {user.correo_uc}
          </h6>
        </div>

        {/* Botón eliminar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "start" }}>
          <i
            className="uc-icon icon-size--lg deleteButton"
            style={{ userSelect: "none", cursor: "pointer" }}
            onClick={() => setShowModal(true)}
          >
            delete
          </i>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >
          <div className="uc-card card-type--horizontal card-border--top" style={{ maxWidth: 400 }}>
            <div className="uc-card_body--xl">
              <div className="h3 my-16" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="uc-icon mr-12">warning</div>
                Confirmar eliminación
              </div>
              <p style={{marginBottom: 0}}>
                ¿Seguro que quieres eliminar a <br/><strong>{user.nombres} {user.apellidos}</strong>?
              </p>
              <hr className="uc-hr my-32 mx-18" />
              <div className="mt-auto" style={{ display: "flex", justifyContent: "flex-end", gap: 20 }}>
                {/* Botón Cancelar */}
                <a
                  href="#"
                  className="uc-btn btn-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowModal(false);
                  }}
                >
                  Cancelar
                </a>

                {/* Botón Eliminar */}
                <a
                  style={{display:"flex"}}
                  href="#"
                  className="uc-btn btn-cta"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete();
                  }}
                >
                  Eliminar
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
