'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import Cookies from 'js-cookie'
import { useRouter, useSearchParams } from 'next/navigation'

type AuthAttributes = {
  uid: string
  apellidos?: string
  givenName?: string
}

type AuthUser = {
  user: string
  attributes: AuthAttributes
}

type CookieUserData = {
  authenticationSuccess: AuthUser
}

type DbUser = {
  uid: string
  nombres: string | null
  apellidos: string | null
}

type ViewState =
  | { kind: 'loading' }
  | { kind: 'denied' }
  | { kind: 'ready'; authUser: AuthUser }

type Ctx = {
  state: ViewState
  initials: string
  logout: () => void
}

const AuthContext = createContext<Ctx>({
  state: { kind: 'loading' },
  initials: '',
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const params = useSearchParams()
  const [state, setState] = useState<ViewState>({ kind: 'loading' })

  // logout compartido
  const logout = () => {
    Cookies.remove('user')
    const casLogoutUrl = 'https://sso-lib.uc.cl/cas/logout?service=http://localhost:3000/'
    window.location.href = casLogoutUrl
  }

  useEffect(() => {
    const deniedFlag =
      params.get('denied') === '1' ||
      (typeof window !== 'undefined' && sessionStorage.getItem('accessDenied') === '1')

    if (deniedFlag) {
      sessionStorage.removeItem('accessDenied')
      setState({ kind: 'denied' })
      const t = setTimeout(() => router.replace('/'), 2000)
      setTimeout(() => logout(), 2000)
      return () => clearTimeout(t)
    }

    const userData = Cookies.get('user')
    if (!userData) {
      router.replace('/login')
      return
    }

    let parsed: CookieUserData
    try {
      parsed = JSON.parse(userData) as CookieUserData
    } catch {
      Cookies.remove('user')
      router.replace('/login')
      return
    }

    const authUser = parsed?.authenticationSuccess
    const uid = authUser?.attributes?.uid
    if (!authUser || !uid) {
      Cookies.remove('user')
      router.replace('/login')
      return
    }

    ;(async () => {
      try {
        const res = await fetch(`/api/usuario?uid=${encodeURIComponent(uid)}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        })

        if (res.status === 404) {
          setState({ kind: 'denied' })
          setTimeout(() => router.replace('/'), 2000)
          console.warn(`Usuario no encontrado: uid=${uid}`)
          return
        }

        if (!res.ok) {
          Cookies.remove('user')
          router.replace('/login')
          console.error(`Error al obtener usuario: ${res.status} ${res.statusText}`)
          return
        }

        const dbUser: DbUser = await res.json()

        const merged: AuthUser = {
          user: authUser.user, // el uid/username del CAS
          attributes: {
            uid,
            givenName: (dbUser.nombres ?? '').trim(),
            apellidos: (dbUser.apellidos ?? '').trim(),
          },
        }

        setState({ kind: 'ready', authUser: merged })
      } catch {
        Cookies.remove('user')
        router.replace('/login')
        console.error('Error al conectar con la API de usuario')
      }
    })()
  }, [params, router])

  // Initials: primera letra del nombre + primera letra del primer apellido
  const initials = useMemo(() => {
    if (state.kind !== 'ready') return ''
    const name = state.authUser.attributes.givenName ?? ''
    const last = (state.authUser.attributes.apellidos ?? '').split(/\s+/)[0] ?? ''
    const i1 = name.trim().charAt(0)
    const i2 = last.trim().charAt(0)
    return `${i1}${i2}`.toUpperCase()
  }, [state])

  const value = useMemo<Ctx>(() => ({ state, initials, logout }), [state, initials])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
