export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "node:path";
import { query } from "@/app/lib/db";
import type { FeatureCollection } from "geojson";
import type { Route, RoutePlaces } from "@/app/types/routeType";
import MapUtils from "@/utils/MapUtils";

const EMPTY_FC: FeatureCollection = { type: "FeatureCollection", features: [] };

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const routeId = parseInt(id);
    
    if (isNaN(routeId)) {
      return NextResponse.json({ error: "ID de ruta inválido" }, { status: 400 });
    }

    const sqlPathRoute = path.join(process.cwd(), "src", "sql", "getRouteById.sql");
    const sqlRoute = await fs.readFile(sqlPathRoute, "utf8");

    const sqlPathRoutePlaces = path.join(process.cwd(), "src", "sql", "getPlaceRoutes.sql");
    const sqlRoutePlaces = await fs.readFile(sqlPathRoutePlaces, "utf8");

    const routeRows = query.all<Route>(sqlRoute, [routeId]);
    const routePlacesRows = query.all<RoutePlaces>(sqlRoutePlaces);

    if (routeRows.length === 0) {
      return NextResponse.json({ error: "Ruta no encontrada" }, { status: 404 });
    }

    const route = routeRows[0];
    const fc = MapUtils.toFeatureCollection(route.geojson) ?? EMPTY_FC;
    
    const normalized = { 
      ...route, 
      featureCollection: fc,
      placeIds: routePlacesRows.filter(routePlace => 
                    routePlace.id_ruta === route.id_ruta)
                    .map(routePlace => routePlace.id_lugar)
    };

    return NextResponse.json(normalized, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
    
  } catch (err) {
    console.error("[DB] Error Ruta por ID:", err);
    return NextResponse.json({ error: "Error consultando BD" }, { status: 500 });
  }
}