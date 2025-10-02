export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "node:path";
import { query } from "../../../lib/db";

// Type for route with icon and color info
type RouteType = {
  id_ruta: number;
  nombre_ruta: string;
  icono: string | null;
  color_icono: string | null;
};

// Cache the route types data since it changes less frequently
let cachedRouteTypes: RouteType[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET() {
  try {
    const now = Date.now();
    
    // Check if we have valid cached data
    if (cachedRouteTypes && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json(cachedRouteTypes, {
        status: 200,
        headers: { 
          "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
          "X-Cache": "HIT"
        },
      });
    }

    // Read SQL query to get all routes with their icons and colors
    const sqlPath = path.join(process.cwd(), "src", "sql", "getRouteTypes.sql");
    const sql = await fs.readFile(sqlPath, "utf8");

    const rows = await query.all<RouteType>(sql);

    // Update cache
    cachedRouteTypes = rows;
    cacheTimestamp = now;

    return NextResponse.json(rows, {
      status: 200,
      headers: { 
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
        "X-Cache": "MISS"
      },
    });
  } catch (err) {
    console.error("[DB] Error getting route types:", err);
    return NextResponse.json({ error: "Error consultando BD" }, { status: 500 });
  }
}