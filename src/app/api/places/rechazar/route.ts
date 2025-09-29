import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  try {
    await query.run(
      'UPDATE ubicacion_geografica SET fk_id_estado_ubicacion_geografica = 1 WHERE id_ubicacion_geografica = ?',
      [id]
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al rechazar' }, { status: 500 });
  }
}
