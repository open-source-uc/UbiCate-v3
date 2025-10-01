import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function GET() {
  try {
    const campusQuery = `
      SELECT id_campus, nombre_campus 
      FROM campus 
      ORDER BY nombre_campus
    `;
    
    const campuses = query.all(campusQuery);
    
    return NextResponse.json(campuses);
  } catch (error) {
    console.error('Error fetching campuses:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}