import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/lib/db";

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

    // Update the ubicacion_geografica estado to 2 (Aceptado)
    const updateSql = `
      UPDATE ubicacion_geografica 
      SET fk_id_estado_ubicacion_geografica = 2 
      WHERE id_ubicacion_geografica = (
        SELECT fk_id_ubicacion_geografica 
        FROM ruta 
        WHERE id_ruta = ?
      )
    `;

    query.run(updateSql, [id_ruta]);

    return NextResponse.json({ 
      success: true, 
      message: "Ruta aprobada exitosamente" 
    });

  } catch (error) {
    console.error("Error approving route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}