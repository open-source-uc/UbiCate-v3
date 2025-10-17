export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "node:path";
import { query } from "../../lib/db";
import type { Feature, FeatureCollection } from "geojson";
import type { Campus } from "@/app/types/campusType";
import logger from "@/app/lib/logger";

type DbCampusRow = Campus & { geojson: unknown };

const EMPTY_FC: FeatureCollection = { type: "FeatureCollection", features: [] };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isFeatureCollection(v: unknown): v is FeatureCollection {
  if (!isRecord(v)) return false;
  const t = v["type"];
  const f = v["features"];
  return t === "FeatureCollection" && Array.isArray(f);
}

function isFeature(v: unknown): v is Feature {
  return isRecord(v) && v["type"] === "Feature";
}

function toFeatureCollection(data: unknown): FeatureCollection | null {
  if (!data) return null;
  let v: unknown = data;

  if (typeof v === "string") {
    try {
      v = JSON.parse(v) as unknown;
    } catch {
      return null;
    }
  }

  if (isFeatureCollection(v)) return v;
  if (isFeature(v)) return { type: "FeatureCollection", features: [v] };
  if (Array.isArray(v)) return { type: "FeatureCollection", features: v as Feature[] };

  return null;
}

export async function GET() {
  try {
    const sqlPath = path.join(process.cwd(), "src", "sql", "getCampus.sql");
    const sql = await fs.readFile(sqlPath, "utf8");

    const rows = query.all<DbCampusRow>(sql);

    const normalized = rows.map((campus) => {
      const fc = toFeatureCollection(campus.geojson) ?? EMPTY_FC;
      return { ...campus, featureCollection: fc };
    });
    logger.info("Consulta de campus completada");
    return NextResponse.json(normalized, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    logger.error("[DB] Error campus:", err);
    return NextResponse.json({ error: "Error consultando BD" }, { status: 500 });
  }
}
