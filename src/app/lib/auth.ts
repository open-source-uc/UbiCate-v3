/**
 * Utilidad para obtener información del usuario autenticado desde las cookies
 * en endpoints del servidor
 */

import { cookies } from 'next/headers';

export interface UsuarioAutenticado {
  uid: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
}

/**
 * Obtiene la información del usuario autenticado desde las cookies
 * 
 * @returns UsuarioAutenticado | null si no está autenticado
 */
export async function obtenerUsuarioAutenticado(): Promise<UsuarioAutenticado | null> {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('user');

    if (!userCookie?.value) {
      return null;
    }

    const userData = JSON.parse(userCookie.value);
    const authUser = userData?.authenticationSuccess;
    const uid = authUser?.attributes?.uid;

    if (!authUser || !uid) {
      return null;
    }

    // Intentar obtener datos completos del usuario desde la base de datos
    let nombres = '';
    let apellidos = '';

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/usuario?uid=${encodeURIComponent(uid)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (response.ok) {
        const dbUser = await response.json();
        nombres = (dbUser.nombres ?? authUser.attributes.givenName ?? '').trim();
        apellidos = (dbUser.apellidos ?? authUser.attributes.apellidos ?? '').trim();
      }
    } catch (error) {
      console.warn('[AUTH] No se pudo obtener usuario de BD, usando datos de CAS:', error);
      nombres = (authUser.attributes.givenName ?? '').trim();
      apellidos = (authUser.attributes.apellidos ?? '').trim();
    }

    // Si no hay nombres/apellidos, usar UID como nombre de usuario
    const nombreCompleto = `${nombres} ${apellidos}`.trim() || uid;

    return {
      uid,
      nombres: nombres || uid,
      apellidos: apellidos || '',
      nombreCompleto
    };

  } catch (error) {
    console.error('[AUTH] Error obteniendo usuario autenticado:', error);
    return null;
  }
}

/**
 * Middleware para endpoints que requieren autenticación
 * Retorna el usuario autenticado o lanza un error
 */
export async function requireAuth(): Promise<UsuarioAutenticado> {
  const usuario = await obtenerUsuarioAutenticado();
  
  if (!usuario) {
    throw new Error('Usuario no autenticado');
  }

  return usuario;
}
