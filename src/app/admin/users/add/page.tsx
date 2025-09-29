'use client';

import { useUser } from "@/app/components/context/userContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../auth-provider";

export default function Page() {
  const { user, clearUser } = useUser();
  const router = useRouter();
  const { state } = useAuth();
  const [formData, setFormData] = useState({
    rut: "",
    dv: "",
    nombres: "",
    primerApellido: "",
    segundoApellido: "",
    nombreUsuario: "",
    roles: [] as string[],
  });

  // Estados para mensajes flotantes
  const [ucSuccessMessage, setUcSuccessMessage] = useState<string | null>(null);
  const [ucErrorMessage, setUcErrorMessage] = useState<string | null>(null);
  const [ucWarningMessage, setUcWarningMessage] = useState<string | null>(null);

  // Estados para checkbox de privacidad
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [privacyError, setPrivacyError] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        rut: user.rut,
        dv: user.dv,
        nombres: user.nombres,
        primerApellido: user.primerApellido,
        segundoApellido: user.segundoApellido,
        nombreUsuario: user.nombreUsuario,
        roles: user.roles,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedPrivacy) {
      setPrivacyError(true);
      return;
    }

    if (state.kind === "loading") return;
    if (state.kind === "denied") {
      setUcErrorMessage("No tienes acceso administrador");
      return;
    }

    try {
      const res = await fetch("/api/usuario/insertAdmins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      // Warning si usuario duplicado
      if (data.type === "warning") {
        setUcWarningMessage(data.message);
        return;
      }

      if (res.ok && data.success) {
        setUcSuccessMessage("Usuario insertado correctamente");
        setTimeout(() => {
          setUcSuccessMessage(null);
          router.push("/admin/users");
        }, 2500);
      } else {
        setUcErrorMessage(data.message || "Error al insertar usuario");
      }
    } catch (err) {
      console.error(err);
      setUcErrorMessage("Error al conectar con el servidor");
    }
  };

  if (!user) {
    return <p>No hay usuario cargado. Vuelve desde la búsqueda.</p>;
  }

  return (
    <div className="container mt-60" style={{maxWidth:"96%"}}>
      {/* Overlay y mensajes */}
      {(ucSuccessMessage || ucErrorMessage || ucWarningMessage) && (
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
            onClick={() => {
              setUcSuccessMessage(null);
              setUcErrorMessage(null);
              setUcWarningMessage(null);
            }}
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
            {ucSuccessMessage && (
              <div className="uc-message success mb-32" style={{ position: "relative" }}>
                <a
                  href="#"
                  className="uc-message_close-button"
                  onClick={(e) => {
                    e.preventDefault();
                    setUcSuccessMessage(null);
                  }}
                >
                  <i className="uc-icon">close</i>
                </a>
                <div className="uc-message_body">
                  <h2 className="mb-24">
                    <i className="uc-icon warning-icon">check_circle</i> Éxito
                  </h2>
                  <p className="no-margin">{ucSuccessMessage}</p>
                </div>
              </div>
            )}

            {ucErrorMessage && (
              <div className="uc-message error mb-32" style={{ position: "relative" }}>
                <a
                  href="#"
                  className="uc-message_close-button"
                  onClick={(e) => {
                    e.preventDefault();
                    setUcErrorMessage(null);
                  }}
                >
                  <i className="uc-icon">close</i>
                </a>
                <div className="uc-message_body">
                  <h2 className="mb-24">
                    <i className="uc-icon warning-icon">error</i> Ha ocurrido un error
                  </h2>
                  <p className="no-margin">{ucErrorMessage}</p>
                </div>
              </div>
            )}

            {ucWarningMessage && (
              <div className="uc-message warning mb-32" style={{ position: "relative" }}>
                <a
                  href="#"
                  className="uc-message_close-button"
                  onClick={(e) => {
                    e.preventDefault();
                    setUcWarningMessage(null);
                  }}
                >
                  <i className="uc-icon">close</i>
                </a>
                <div className="uc-message_body">
                  <h2 className="mb-24">
                    <i className="uc-icon warning-icon">warning</i> Problema al ingresar al usuario
                  </h2>
                  <p className="no-margin">
                    El usuario que se intenta agregar como administrador ya existe dentro del sistema {process.env.NEXT_PUBLIC_APP_TITLE}
                  </p>
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
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Formulario */}
      <div className="row" style={{justifyContent: "center"}}>
        <div className="col-xl-16 col-lg-12">
          <div className="mb-160 p-10 form-container">
            <h4>Formulario de ingreso de administrador</h4>
            <div className="uc-text-divider divider-secondary mt-16 mb-4"></div>
            <p className="p-size--sm p-text--condensed p-color--gray mb-0 mt-32">
              (*) Campos obligatorios necesarios para procesar tu suscripción en
              la lista correcta.
            </p>
            <hr className="uc-hr mx-16 mb-24" />
            <form className="" onSubmit={handleSubmit}>
              
              {/* Campos del formulario */}
              <div className="col-md-6 mb-24 uc-form-group" style={{padding:"0px 6px"}}>
                <label htmlFor="rut" style={{fontSize:"14px"}}>
                  Rut <mark style={{color:"red", backgroundColor: "transparent"}}>*</mark>
                </label>
                <input id="rut" type="text" className="uc-input-style" value={formData.rut} readOnly disabled />
              </div>
              <div className="col-md-6 mb-24 uc-form-group" style={{padding:"0px 6px"}}>
                <label htmlFor="dv" style={{fontSize:"14px"}}>
                  Digito Verificador <mark style={{color:"red", backgroundColor: "transparent"}}>*</mark>
                </label>
                <input id="dv" type="text" className="uc-input-style" value={formData.dv} readOnly disabled />
              </div>
              <div className="col-md-12 mb-24 uc-form-group" style={{padding:"0px 6px"}}>
                <label htmlFor="email" style={{fontSize:"14px"}}>
                  Correo UC <mark style={{color:"red", backgroundColor: "transparent"}}>*</mark>
                </label>
                <input id="email" type="email" className="uc-input-style" value={`${formData.nombreUsuario}@uc.cl`} readOnly disabled />
              </div>
              <div className="col-md-6 mb-24 uc-form-group" style={{padding:"0px 6px"}}>
                <label htmlFor="name" style={{fontSize:"14px"}}>
                  Nombres <mark style={{color:"red", backgroundColor: "transparent"}}>*</mark>
                </label>
                <input id="name" type="text" className="uc-input-style" value={formData.nombres} readOnly disabled />
              </div>
              <div className="col-md-6 mb-24 uc-form-group" style={{padding:"0px 6px"}}>
                <label htmlFor="lastname" style={{fontSize:"14px"}}>
                  Apellidos <mark style={{color:"red", backgroundColor: "transparent"}}>*</mark>
                </label>
                <input id="lastname" type="text" className="uc-input-style" value={`${formData.primerApellido} ${formData.segundoApellido}`} readOnly disabled />
              </div>

              <hr className="uc-hr my-36 mx-16" />

              {/* Consentimiento */}
              <div className="col-md-12 mb-16">
                <div className="p-24" style={{ border: "1px solid #eaeaea", borderRadius: "4px" }}>
                  <p className="p-color--gray mb-16">
                    Autorizo expresamente a la UC para tratar los datos personales necesarios para la inscripción a la
                    actividad {process.env.NEXT_PUBLIC_APP_TITLE} los cuales serán informados a la unidad
                    organizadora. Los
                    datos personales serán usados solamente para la inscripción a esta actividad y se <strong> mantendrán
                    mientras
                    sean requeridos por Ley.</strong>
                  </p>
                  <div className="uc-form-check">
                    <input
                      id="privacy"
                      type="checkbox"
                      checked={acceptedPrivacy}
                      onChange={(e) => {
                        setAcceptedPrivacy(e.target.checked);
                        setPrivacyError(false);
                      }}
                    />
                    <label htmlFor="privacy">
                      * Acepto que la UC trate mis datos personales para esta actividad, y he leído y acepto la{" "}
                      <a href="https://protecciondedatos.uc.cl/politicas" target="_blank">Política de Privacidad UC</a>.
                    </label>
                    {privacyError && (
                      <p style={{ color: "red", marginTop: "8px", fontSize: "14px" }}>
                        Se deben aceptar las condiciones y políticas de privacidad de la UC para poder agregar el usuario
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones */}
             <div className="d-flex flex-md-row col-md-12 justify-content-between align-items-center">
                <div className="col-6 col-md-4 mt-36">
                  <a
                    href="/admin/users"
                    className="uc-btn btn-primary d-flex justify-content-center flex-fill"
                    onClick={(e) => {
                      e.preventDefault();
                      clearUser();
                      router.push("/admin/users");
                    }}
                  >
                    Cancelar
                  </a>
                </div>
                <div className="col-6 col-md-4 mt-36">
                  <button type="submit" className="uc-btn btn-cta w-full flex-fill">Enviar</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}