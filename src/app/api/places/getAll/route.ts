export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "node:path";
import { query } from "@/app/lib/db";
import type { FeatureCollection } from "geojson";
import type { Place, Image } from "@/app/types/placeType";
import MapUtils from "@/utils/MapUtils";

type DbPlaceRow = Place & { geojson: unknown };

const EMPTY_FC: FeatureCollection = { type: "FeatureCollection", features: [] };

export async function GET() {
  try {
    const placeSQqlPath = path.join(process.cwd(), "src", "sql", "getPlaces.sql");
    const place_sql = await fs.readFile(placeSQqlPath, "utf8");
    const placeRows = query.all<DbPlaceRow>(place_sql);
        // Solo normaliza el geojson, no trae imágenes
    const normalized = placeRows.map((place) => {
      const fc = MapUtils.toFeatureCollection(place.geojson) ?? EMPTY_FC;
      return {
        ...place,
        featureCollection: fc,
      };
    });

    return NextResponse.json(normalized, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
    
  } catch (err) {
    console.error("[DB] Error places:", err);
    return NextResponse.json({ error: "Error consultando BD" }, { status: 500 });
  }
}
