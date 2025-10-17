import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import logger from '@/app/lib/logger';

export async function GET() {
  try {
    const campusQuery = `
      SELECT id_campus, nombre_campus 
      FROM campus 
      ORDER BY nombre_campus
    `;
    
    const campuses = query.all(campusQuery);
    logger.info('Campus consultados exitosamente');
    return NextResponse.json(campuses);
  } catch (error) {
    logger.error('Error consultando los campuses:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}