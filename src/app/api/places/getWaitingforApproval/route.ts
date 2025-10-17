export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "node:path";
import { query } from "@/app/lib/db";
import type { FeatureCollection } from "geojson";
import type { Place, Image } from "@/app/types/placeType";
import MapUtils from "@/utils/MapUtils";
import logger from "@/app/lib/logger";

type DbPlaceRow = Place & { geojson: unknown };

const EMPTY_FC: FeatureCollection = { type: "FeatureCollection", features: [] };

export async function GET() {
  try {
    const placeSQqlPath = path.join(process.cwd(), "src", "sql", "getPlacesPorAprobar.sql");
    const imagesSQqlPath = path.join(process.cwd(), "src", "sql", "getPlaceImages.sql");
    const place_sql = await fs.readFile(placeSQqlPath, "utf8");
    const image_sql = await fs.readFile(imagesSQqlPath, "utf8");

    const placeRows = query.all<DbPlaceRow>(place_sql);

    // Para cada lugar, consulta sus imágenes usando el parámetro
    const normalized = placeRows.map((place) => {
      const fc = MapUtils.toFeatureCollection(place.geojson) ?? EMPTY_FC;
      // Consulta imágenes solo para este lugar
      const imgs = query.all<Image>(image_sql, place.id_ubicacion_geografica).map((img) => ({
        ...img,
        binario: `data:${img.mime_type};base64,${Buffer.from(img.binario).toString("base64")}`,
      }));
      logger.info("GeoJSON normalizado:", fc);  
      return {
        ...place,
        featureCollection: fc,
        images: imgs,
      };
      });

    logger.info("Consulta de lugares por aprobar completada:", normalized);
    return NextResponse.json(normalized, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
    
  } catch (err) {
    logger.error("[DB] Error places:", err);
    return NextResponse.json({ error: "Error consultando BD" }, { status: 500 });
  }
}
