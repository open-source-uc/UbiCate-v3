import { NextRequest, NextResponse } from 'next/server';
import { obtenerHistoricoCompleto, obtenerHistorico } from '@/app/lib/auditLog';
import logger from '@/app/lib/logger';

export const runtime = "nodejs";

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
    
    logger.info("Consulta de histórico completada:", historico);
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
    logger.error('[API] Error obteniendo histórico:', error);
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
