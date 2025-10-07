import { NextRequest, NextResponse } from 'next/server';
import { obtenerHistoricoCompleto, obtenerHistorico } from '@/app/lib/auditLog';

export const runtime = "nodejs";

/**
 * GET /api/places/historico
 * Obtiene el histórico de cambios en lugares y rutas
 * 
 * Query params opcionales:
 * - id_ubicacion: filtrar por una ubicación específica
 * - limit: número de registros a devolver (default: 100)
 * - offset: número de registros a saltar para paginación (default: 0)
 * 
 * Ejemplos:
 * - GET /api/places/historico - Obtiene las últimas 100 entradas
 * - GET /api/places/historico?id_ubicacion=123 - Histórico de una ubicación específica
 * - GET /api/places/historico?limit=50&offset=0 - Primeras 50 entradas
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const idUbicacion = searchParams.get('id_ubicacion');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let historico;

    if (idUbicacion) {
      // Histórico de una ubicación específica
      historico = await obtenerHistorico(parseInt(idUbicacion));
    } else {
      // Histórico completo con paginación
      historico = await obtenerHistoricoCompleto(limit, offset);
    }

    return NextResponse.json({
      success: true,
      data: historico,
      count: historico.length,
      params: {
        id_ubicacion: idUbicacion,
        limit,
        offset
      }
    });

  } catch (error) {
    console.error('[API] Error obteniendo histórico:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener histórico',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
