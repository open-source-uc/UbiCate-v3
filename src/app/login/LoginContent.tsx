// app/login/LoginContent.tsx
'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'

export default function LoginContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const didRun = useRef(false) // evita doble validación en Strict Mode

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true

    const ticket = searchParams.get('ticket')
    const service = `${window.location.origin}/login`

    if (ticket) {
      axios
        .post('/api/cas/validate', { ticket, service })
        .then(res => {
          const user = res.data
          if (user.authenticationSuccess) {
            Cookies.set('user', JSON.stringify(user), { expires: 1, sameSite: 'Lax' })
            router.replace('/admin/users')
          } else {
            setError('Autenticación fallida')
            console.log('❌ Error de autenticación:', user)
          }
        })
        .catch(err => {
          const status = err?.response?.status
          const data = err?.response?.data
          if (status === 403) {
            sessionStorage.setItem('accessDenied', '1')
            router.replace('/admin?denied=1')
            console.log('❌ Acceso denegado:', data)
            return
          }
          if (status === 401) {
            setError('Ticket inválido o expirado')
            router.replace('/login')
            console.log('❌ Ticket inválido:', data)
            return
          }
          setError('Error en validación')
          console.log('❌ Error al validar ticket:', status, data)
        })
    } else {
      const casUrl = `https://sso-lib.uc.cl/cas/login?service=${encodeURIComponent(service)}`
      window.location.href = casUrl
      console.log('🔄 Redirigiendo a CAS para autenticación...')
    }
  }, [searchParams, router])

return (
  <div className="fixed inset-0 z-[9999] grid place-items-center bg-white/70">
    <div className="border border-black p-6 rounded-md shadow-md bg-white">
      <p className="text-lg">{error ?? 'Autenticando con CAS...'}</p>
    </div>
  </div>
)


}
