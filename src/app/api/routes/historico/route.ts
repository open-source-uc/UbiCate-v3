import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/lib/db";
import logger from "@/app/lib/logger";

export const runtime = "nodejs";

/**
 * GET /api/routes/historico
 * Obtiene el histórico de cambios de rutas
 * Query params opcionales:
 * - id_ruta: filtra por ID de ruta específica
 * - limit: cantidad de registros (default: sin límite)
 * - offset: offset para paginación (default: 0)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idRuta = searchParams.get("id_ruta");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset") || "0";

    let sql = `
      SELECT 
        h.id_historico_ruta,
        h.nombre_usuario,
        h.tipo_operacion,
        h.mensaje,
        h.fecha,
        h.fk_id_ruta,
        r.nombre_ruta,
        c.nombre_campus
      FROM historico_ruta h
      LEFT JOIN ruta r ON h.fk_id_ruta = r.id_ruta
      LEFT JOIN campus c ON r.fk_id_campus = c.id_campus
    `;

    const params: any[] = [];

    // Filtrar por ruta específica si se proporciona
    if (idRuta) {
      sql += ` WHERE h.fk_id_ruta = ?`;
      params.push(Number(idRuta));
    }

    sql += ` ORDER BY h.fecha DESC`;

    // Agregar límite y offset si se proporcionan
    if (limit) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(Number(limit), Number(offset));
    }

    const rows = await query.all<{
      id_historico_ruta: number;
      nombre_usuario: string;
      tipo_operacion: string;
      mensaje: string;
      fecha: string;
      fk_id_ruta: number;
      nombre_ruta: string | null;
      nombre_campus: string | null;
    }>(sql, params);

    // Obtener conteo total para paginación
    let countSql = `
      SELECT COUNT(*) as total
      FROM historico_ruta h
    `;
    const countParams: any[] = [];

    if (idRuta) {
      countSql += ` WHERE h.fk_id_ruta = ?`;
      countParams.push(Number(idRuta));
    }

    const countResult = await query.get<{ total: number }>(countSql, countParams);
    logger.info("Conteo total de histórico de rutas:", countResult?.total); 
    return NextResponse.json({
      success: true,
      data: rows,
      count: countResult?.total || 0
    });
  } catch (error) {
    logger.error("[API] Error obteniendo histórico de rutas:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener el histórico de rutas"
      },
      { status: 500 }
    );
  }
}
