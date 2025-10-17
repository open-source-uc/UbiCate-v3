export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "node:path";
import { query } from "@/app/lib/db";
import type { FeatureCollection } from "geojson";
import type { Route, RoutePlaces } from "@/app/types/routeType";
import MapUtils from "@/utils/MapUtils";
import logger from "@/app/lib/logger";

// type DbRouteRow = Route;

const EMPTY_FC: FeatureCollection = { type: "FeatureCollection", features: [] };

export async function GET() {
  try {
    const sqlPathRoutes = path.join(process.cwd(), "src", "sql", "getRoutes.sql");
    const sqlRoutes = await fs.readFile(sqlPathRoutes, "utf8");

    const sqlPathRoutePlaces = path.join(process.cwd(), "src", "sql", "getPlaceRoutes.sql");
    const sqlRoutePlaces = await fs.readFile(sqlPathRoutePlaces, "utf8");

    const routeRows = query.all<Route>(sqlRoutes);
    const routePlacesRows = query.all<RoutePlaces>(sqlRoutePlaces);

    const normalized = routeRows.map((route) => {
      const fc = MapUtils.toFeatureCollection(route.geojson) ?? EMPTY_FC;
      return { 
        ...route, 
        featureCollection: fc,
        placeIds: routePlacesRows.filter(routePlace => 
                      routePlace.id_ruta === route.id_ruta)
                      .map(routePlace => routePlace.id_lugar)
      };
    });
    
    logger.info("Consulta de rutas publicadas completada:", normalized);
    return NextResponse.json(normalized, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
    
  } catch (err) {
    logger.error("[DB] Error Rutas:", err);
    return NextResponse.json({ error: "Error consultando BD" }, { status: 500 });
  }
}