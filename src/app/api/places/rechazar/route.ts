import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/db';
import { registrarHistorico } from '@/app/lib/auditLog';
import { obtenerUsuarioAutenticado } from '@/app/lib/auth';

export async function POST(req: NextRequest) {
  const { id, nombreLugar } = await req.json();
  
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  
  try {
    // Obtener usuario autenticado
    const usuario = await obtenerUsuarioAutenticado();
    if (!usuario) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener información del lugar si no se proporcionó
    let nombreElemento = nombreLugar;
    if (!nombreElemento) {
      const lugar = await query.get<{ nombre_lugar: string }>(
        'SELECT nombre_lugar FROM lugar WHERE fk_id_ubicacion_geografica = ?',
        [id]
      );
      nombreElemento = lugar?.nombre_lugar || 'Sin nombre';
    }

    // Rechazar el lugar
    await query.run(
      'UPDATE ubicacion_geografica SET fk_id_estado_ubicacion_geografica = 1 WHERE id_ubicacion_geografica = ?',
      [id]
    );

    // Registrar en el histórico
    await registrarHistorico({
      idUbicacion: id,
      nombreUsuario: usuario.nombreCompleto,
      tipoOperacion: 'RECHAZAR',
      nombreElemento
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error al rechazar:', error);
    return NextResponse.json({ error: 'Error al rechazar' }, { status: 500 });
  }
}
