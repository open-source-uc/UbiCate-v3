export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "node:path";
import { query } from "../../../lib/db";
import logger from "@/app/lib/logger";

// Type for route with icon and color info
type RouteType = {
  id_ruta: number;
  nombre_ruta: string;
  icono: string | null;
  color_icono: string | null;
};

export async function GET() {
  try {
    // Read SQL query to get all routes with their icons and colors
    const sqlPath = path.join(process.cwd(), "src", "sql", "getRouteTypes.sql");
    const sql = await fs.readFile(sqlPath, "utf8");

    const rows = await query.all<RouteType>(sql);
    logger.info("Tipo de Rutas conseguidas:", rows);
    return NextResponse.json(rows, {
      status: 200,
    });
  } catch (err) {
    logger.error("[DB] Error al consultar tipos de rutas:", err);
    return NextResponse.json({ error: "Error consultando BD" }, { status: 500 });
  }
}