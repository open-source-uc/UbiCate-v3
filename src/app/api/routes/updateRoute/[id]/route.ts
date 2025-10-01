export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'node:path';
import { query } from '@/app/lib/db';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const routeId = parseInt(id);
    const body = await request.json();
    const { nombre_ruta, descripcion, id_campus, placeIds, geojson } = body;

    if (!routeId || !nombre_ruta || !id_campus) {
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
        return NextResponse.json(
          { message: 'Ruta no encontrada' },
          { status: 404 }
        );
      }

      // Update route basic info
      query.run(updateRutaSQL, [
        nombre_ruta,
        id_campus,
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

      return NextResponse.json({
        message: 'Ruta actualizada exitosamente',
        id_ruta: routeId
      });

    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error updating route:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}