'use client'

import { useAuth } from './auth-provider'

const PageTitle: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ marginBottom: "2rem", textAlign: "left" }}>
    <h1 style={{ fontSize: "2rem", color: "#0176DE", margin: 0 }}>{title}</h1>
  </div>
);

export default function Page() {
  const { state } = useAuth()
  
  if (state.kind === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Cargando…</p>
      </div>
    )
  }

  if (state.kind === 'denied') {
    console.log(`Acceso denegado: usuario no autorizado`)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="rounded-xl shadow p-6 text-center">
          <h2 className="text-2xl font-semibold mb-2">No tienes acceso administrador</h2>
          <p className="text-sm text-gray-600">Serás redirigido desconectado de la sesión</p>
        </div>
      </div>
    )
  }

  const { attributes } = state.authUser
  console.log(`Acceso autorizado: usuario ${attributes.uid}`)
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1rem',
      }}
      className="w-full"
    >
      <PageTitle title="Panel de Administración" />

      <div>
        <p>
          Bienvenido, <strong>{attributes.givenName} {attributes.apellidos}</strong>
        </p>
        <p>UID: {attributes.uid}</p>
        <p>Apellidos: {attributes.apellidos}</p>
        <p>Nombre: {attributes.givenName}</p>
      </div>
    </div>
  )
}
