export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'node:path';
import { query } from '@/app/lib/db';
import { registrarHistoricoRuta } from '@/app/lib/auditLog';
import { obtenerUsuarioAutenticado } from '@/app/lib/auth';
import logger from '@/app/lib/logger';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const routeId = parseInt(id);
    const body = await request.json();
    const { nombre_ruta, descripcion, id_campus, placeIds, geojson, icono, color_icono } = body;

    if (!routeId || !nombre_ruta || !id_campus) {
      logger.error("Faltan campos requeridos: nombre_ruta, id_campus");
      return NextResponse.json(
        { message: 'Faltan campos requeridos: nombre_ruta, id_campus' },
        { status: 400 }
      );
    }

    try {
      // Load SQL queries
      const getRutaUbicacionSQL = await fs.readFile(
        path.join(process.cwd(), "src/sql/getRutaUbicacion.sql"),
        "utf8"
      );
      const updateRutaSQL = await fs.readFile(
        path.join(process.cwd(), "src/sql/updateRuta.sql"),
        "utf8"
      );
      const updateUbicacionSQL = await fs.readFile(
        path.join(process.cwd(), "src/sql/updateUbicacionGeografica.sql"),
        "utf8"
      );
      const deleteLugarRutaSQL = await fs.readFile(
        path.join(process.cwd(), "src/sql/deleteLugarRuta.sql"),
        "utf8"
      );
      const insertLugarRutaSQL = await fs.readFile(
        path.join(process.cwd(), "src/sql/insertLugarRuta.sql"),
        "utf8"
      );

      // First get the ubicacion_geografica ID for this route
      const ubicacionResult = query.get(getRutaUbicacionSQL, [routeId]) as { fk_id_ubicacion_geografica: number } | undefined;
      
      if (!ubicacionResult) {
        logger.error("Ruta no encontrada");
        return NextResponse.json(
          { message: 'Ruta no encontrada' },
          { status: 404 }
        );
      }

      // Update route basic info
      query.run(updateRutaSQL, [
        nombre_ruta,
        id_campus,
        icono || null,
        color_icono || null,
        routeId
      ]);

      // Update description and geojson in ubicacion_geografica
      query.run(updateUbicacionSQL, [
        descripcion || null,
        geojson ? JSON.stringify(geojson) : null,
        'Ruta',
        ubicacionResult.fk_id_ubicacion_geografica
      ]);

      // Delete existing place associations
      query.run(deleteLugarRutaSQL, [routeId]);

      // Insert new place associations
      if (placeIds && placeIds.length > 0) {
        for (const placeId of placeIds) {
          query.run(insertLugarRutaSQL, [placeId, routeId]);
        }
      }

      // Obtener usuario autenticado
      const usuario = await obtenerUsuarioAutenticado();
      const nombreUsuario = usuario?.nombreCompleto || 'Sistema';

      // Registrar en histórico
      await registrarHistoricoRuta({
        idRuta: routeId,
        nombreUsuario,
        tipoOperacion: 'ACTUALIZAR',
        nombreRuta: nombre_ruta
      });
      logger.info(`[API] Ruta actualizada ID: ${routeId} por usuario: ${nombreUsuario}`);
      return NextResponse.json({
        message: 'Ruta actualizada exitosamente',
        id_ruta: routeId
      });

    } catch (error) {
      logger.error('Database error:', error);
      throw error;
    }

  } catch (error) {
    logger.error('Error updating route:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}