import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/lib/db";
import { registrarHistoricoRuta } from "@/app/lib/auditLog";
import { obtenerUsuarioAutenticado } from "@/app/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { id_ruta } = await request.json();

    if (!id_ruta) {
      return NextResponse.json(
        { error: "ID de ruta requerido" },
        { status: 400 }
      );
    }

    // Update the ubicacion_geografica estado to 3 (En Espera)
    const updateSql = `
      UPDATE ubicacion_geografica 
      SET fk_id_estado_ubicacion_geografica = 3 
      WHERE id_ubicacion_geografica = (
        SELECT fk_id_ubicacion_geografica 
        FROM ruta 
        WHERE id_ruta = ?
      )
    `;

    query.run(updateSql, [id_ruta]);

    // Obtener nombre de la ruta para el histórico
    const rutaInfo = query.get<{ nombre_ruta: string }>(
      "SELECT nombre_ruta FROM ruta WHERE id_ruta = ?",
      [id_ruta]
    );

    // Obtener usuario autenticado
    const usuario = await obtenerUsuarioAutenticado();
    const nombreUsuario = usuario?.nombreCompleto || 'Sistema';

    // Registrar en histórico como DEVOLVER A CONSTRUCCIÓN
    await registrarHistoricoRuta({
      idRuta: id_ruta,
      nombreUsuario,
      tipoOperacion: 'DEVOLVER A CONSTRUCCIÓN',
      nombreRuta: rutaInfo?.nombre_ruta || 'Ruta sin nombre'
    });

    return NextResponse.json({ 
      success: true, 
      message: "Ruta devuelta a construcción exitosamente" 
    });

  } catch (error) {
    console.error("Error returning route to pending:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
