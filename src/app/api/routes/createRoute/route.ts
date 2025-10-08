import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { query } from "@/app/lib/db";
import { registrarHistoricoRuta } from "@/app/lib/auditLog";
import { obtenerUsuarioAutenticado } from "@/app/lib/auth";

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Request Body:", body); // Log for debugging
    
    const { nombre_ruta, descripcion, id_campus, placeIds, geojson, icono, color_icono } = body;

    // Validation
    if (!nombre_ruta || !id_campus) {
      return NextResponse.json({ 
        success: false, 
        message: 'Nombre de ruta y campus son requeridos' 
      }, { status: 400 });
    }

    // Read SQL files
    const insertUbicacionSql = await fs.readFile(
      path.join(process.cwd(), 'src', 'sql', 'insertLugar.sql'),
      'utf8'
    );
    const insertRutaSql = await fs.readFile(
      path.join(process.cwd(), 'src', 'sql', 'insertRuta.sql'),
      'utf8'
    );
    const insertLugarRutaSql = await fs.readFile(
      path.join(process.cwd(), 'src', 'sql', 'insertLugarRuta.sql'),
      'utf8'
    );
    const getIdEstadoSql = await fs.readFile(
      path.join(process.cwd(), 'src', 'sql', 'getIdEstadoEnEspera.sql'),  
      'utf8'
    );
    const getIdTipoGeojsonSql = await fs.readFile(
      path.join(process.cwd(), 'src', 'sql', 'getIdTipoGeojsonByNombre.sql'),
      'utf8'
    );

    // Get configuration IDs
    const estadoResult = query.get<{ id_estado_ubicacion_geografica: number }>(getIdEstadoSql);
    const tipoGeojsonResult = query.get<{ id_tipo_geojson: number }>(getIdTipoGeojsonSql, ['Ruta']);

    console.log("Estado result:", estadoResult);
    console.log("Tipo geojson result:", tipoGeojsonResult);

    if (!estadoResult || !tipoGeojsonResult) {
      return NextResponse.json({ 
        success: false, 
        message: 'Error al obtener configuración de base de datos' 
      }, { status: 500 });
    }

    const estadoId = estadoResult.id_estado_ubicacion_geografica;
    const tipoGeojsonId = tipoGeojsonResult.id_tipo_geojson;

    // Use transaction for consistency
    const result = query.transaction(() => {
      // 1. Insert ubicacion_geografica
      query.run(insertUbicacionSql, [
        descripcion || `Ubicación geográfica para ruta: ${nombre_ruta}`,
        geojson ? JSON.stringify(geojson) : '{}',
        tipoGeojsonId,
        estadoId
      ]);

      // Get the inserted ubicacion_geografica ID
      const ubicacionResult = query.get<{ id: number }>("SELECT last_insert_rowid() AS id");
      const ubicacionId = ubicacionResult?.id;

      if (!ubicacionId) {
        throw new Error('Error obteniendo ID de ubicación insertada');
      }

      // 2. Insert ruta
      query.run(insertRutaSql, [nombre_ruta, ubicacionId, id_campus, icono || null, color_icono || null]);

      // Get the inserted ruta ID
      const rutaResult = query.get<{ id: number }>("SELECT last_insert_rowid() AS id");
      const rutaId = rutaResult?.id;

      if (!rutaId) {
        throw new Error('Error obteniendo ID de ruta insertada');
      }

      // 3. Insert lugar_ruta associations
      if (placeIds && Array.isArray(placeIds) && placeIds.length > 0) {
        for (const placeId of placeIds) {
          query.run(insertLugarRutaSql, [placeId, rutaId]);
        }
      }

      return rutaId;
    });

    console.log("Transaction completed, ruta ID:", result);

    // Obtener usuario autenticado
    const usuario = await obtenerUsuarioAutenticado();
    const nombreUsuario = usuario?.nombreCompleto || 'Sistema';

    // Registrar en histórico
    await registrarHistoricoRuta({
      idRuta: result,
      nombreUsuario,
      tipoOperacion: 'CREAR',
      nombreRuta: nombre_ruta
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Ruta creada exitosamente',
      rutaId: result
    });

  } catch (error) {
    console.error('[DB] Error creating route:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al crear ruta',
      error: typeof error === "object" && error !== null && "message" in error ? (error as { message: string }).message : String(error)
    }, { status: 500 });
  }
}