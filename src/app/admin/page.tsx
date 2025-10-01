'use client'

import { useAuth } from './auth-provider'
import AdminPageContainer from '../components/ui/admin/AdminPageContainer'

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
    <AdminPageContainer title="Panel de Administración">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        textAlign: 'center'
      }}>
        <div>
          <p>
            Bienvenido, <strong>{attributes.givenName} {attributes.apellidos}</strong>
          </p>
          <p>UID: {attributes.uid}</p>
          <p>Apellidos: {attributes.apellidos}</p>
          <p>Nombre: {attributes.givenName}</p>
        </div>
      </div>
    </AdminPageContainer>
  )
}
