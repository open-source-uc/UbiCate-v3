import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { nombre_ruta, descripcion, id_campus, placeIds } = body;
    const routeId = parseInt(params.id);

    if (!routeId || !nombre_ruta || !id_campus) {
      return NextResponse.json(
        { message: 'Faltan campos requeridos: nombre_ruta, id_campus' },
        { status: 400 }
      );
    }

    try {
      // First get the ubicacion_geografica ID for this route
      const getUbicacionQuery = `
        SELECT fk_id_ubicacion_geografica 
        FROM ruta 
        WHERE id_ruta = ?
      `;
      const ubicacionResult = query.get(getUbicacionQuery, [routeId]) as { fk_id_ubicacion_geografica: number } | undefined;
      
      if (!ubicacionResult) {
        return NextResponse.json(
          { message: 'Ruta no encontrada' },
          { status: 404 }
        );
      }

      // Update route basic info
      const updateRouteQuery = `
        UPDATE ruta 
        SET nombre_ruta = ?, fk_id_campus = ?
        WHERE id_ruta = ?
      `;
      
      query.run(updateRouteQuery, [
        nombre_ruta,
        id_campus,
        routeId
      ]);

      // Update description in ubicacion_geografica
      const updateDescripcionQuery = `
        UPDATE ubicacion_geografica 
        SET descripcion = ?
        WHERE id_ubicacion_geografica = ?
      `;
      
      query.run(updateDescripcionQuery, [
        descripcion || null,
        ubicacionResult.fk_id_ubicacion_geografica
      ]);

      // Delete existing place associations
      const deletePlacesQuery = `DELETE FROM lugar_ruta WHERE fk_id_ruta = ?`;
      query.run(deletePlacesQuery, [routeId]);

      // Insert new place associations
      if (placeIds && placeIds.length > 0) {
        const insertPlaceQuery = `INSERT INTO lugar_ruta (fk_id_lugar, fk_id_ruta) VALUES (?, ?)`;
        for (const placeId of placeIds) {
          query.run(insertPlaceQuery, [placeId, routeId]);
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