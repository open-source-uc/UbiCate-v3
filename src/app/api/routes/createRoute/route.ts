import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre_ruta, descripcion, id_campus, placeIds, geojson, icono, color_icono } = body;

    // Validation
    if (!nombre_ruta || !id_campus) {
      return NextResponse.json({ 
        success: false, 
        message: 'Nombre de ruta y campus son requeridos' 
      }, { status: 400 });
    }

    // Import database
    const Database = (await import('better-sqlite3')).default;
    const dbPath = path.join(process.cwd(), 'db.sqlite');
    const db = new Database(dbPath);

    try {
      // Get SQL queries
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
      const getLastIdSql = await fs.readFile(
        path.join(process.cwd(), 'src', 'sql', 'getLastInsertId.sql'),
        'utf8'
      );

      // Get ID constants
      const getIdEstadoSql = await fs.readFile(
        path.join(process.cwd(), 'src', 'sql', 'getIdEstadoEnEspera.sql'),  
        'utf8'
      );
      const getIdTipoGeojsonSql = await fs.readFile(
        path.join(process.cwd(), 'src', 'sql', 'getIdTipoGeojsonByNombre.sql'),
        'utf8'
      );

      // Get estado and tipo_geojson IDs
      const estadoResult = db.prepare(getIdEstadoSql).get();
      const tipoGeojsonResult = db.prepare(getIdTipoGeojsonSql).get('Ruta');

      if (!estadoResult || !tipoGeojsonResult) {
        return NextResponse.json({ 
          success: false, 
          message: 'Error al obtener configuración de base de datos' 
        }, { status: 500 });
      }

      const estadoId = (estadoResult as any).id_estado_ubicacion_geografica;
      const tipoGeojsonId = (tipoGeojsonResult as any).id_tipo_geojson;

      // Start transaction
      db.prepare('BEGIN').run();

      try {
        // 1. Insert ubicacion_geografica
        const insertUbicacion = db.prepare(insertUbicacionSql);
        insertUbicacion.run(
          descripcion || `Ubicación geográfica para ruta: ${nombre_ruta}`,
          geojson ? JSON.stringify(geojson) : '{}',
          tipoGeojsonId,
          estadoId
        );

        // Get the inserted ubicacion_geografica ID
        const ubicacionResult = db.prepare(getLastIdSql).get();
        const ubicacionId = (ubicacionResult as any).id;

        // 2. Insert ruta
        const insertRuta = db.prepare(insertRutaSql);
        insertRuta.run(nombre_ruta, ubicacionId, id_campus, icono || null, color_icono || null);

        // Get the inserted ruta ID
        const rutaResult = db.prepare(getLastIdSql).get();
        const rutaId = (rutaResult as any).id;

        // 3. Insert lugar_ruta associations
        if (placeIds && Array.isArray(placeIds) && placeIds.length > 0) {
          const insertLugarRuta = db.prepare(insertLugarRutaSql);
          for (const placeId of placeIds) {
            insertLugarRuta.run(placeId, rutaId);
          }
        }

        // Commit transaction
        db.prepare('COMMIT').run();

        return NextResponse.json({ 
          success: true, 
          message: 'Ruta creada exitosamente',
          rutaId: rutaId
        });

      } catch (error) {
        // Rollback transaction
        db.prepare('ROLLBACK').run();
        throw error;
      }

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Error creando ruta:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error interno del servidor' 
    }, { status: 500 });
  }
}