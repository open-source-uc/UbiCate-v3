export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "node:path";
import { query } from "../../../lib/db";
import type * as GeoJSON from "geojson";

async function readSQL(file: string) {
  const p = path.join(process.cwd(), "src", "sql", file);
  return fs.readFile(p, "utf8");
}

function mapGeomToNombre(geomType?: string): "Marcador" | "Polígono" | "Ruta" {
  switch (geomType) {
    case "Point": return "Marcador";
    case "Polygon": return "Polígono";
    case "LineString": return "Ruta";
    default:
      throw new Error(`geometry.type no soportado: ${geomType ?? "undefined"}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { descripcion, geojsonRaw, punto, imagenes } = body || {};

    if (!descripcion || !geojsonRaw || !punto) {
      return NextResponse.json({ message: "Payload incompleto" }, { status: 400 });
    }
    if (!punto.nombre || !punto.id_tipo_lugar || !punto.piso_punto || !punto.id_campus) {
      return NextResponse.json({ message: "Datos de punto_interes incompletos" }, { status: 400 });
    }

    if (imagenes && !Array.isArray(imagenes)) {
      return NextResponse.json({ message: "'imagenes' debe ser un arreglo base64" }, { status: 400 });
    }

    if (imagenes?.length) {
      for (const [index, img] of imagenes.entries()) {
        if (typeof img?.base64 !== "string" || !img.base64.startsWith("data:image/")) {
          return NextResponse.json({ message: `La imagen #${index + 1} no es un base64 válido` }, { status: 400 });
        }
        const estimatedSizeBytes = (img.base64.length * 3) / 4;
        if (estimatedSizeBytes > 3 * 1024 * 1024) {
          return NextResponse.json({ message: `La imagen #${index + 1} excede los 3MB permitidos` }, { status: 400 });
        }
      }
    }

    let geoParsed: GeoJSON.Feature | GeoJSON.FeatureCollection;
    try {
      geoParsed = JSON.parse(geojsonRaw);
    } catch {
      return NextResponse.json({ message: "El formato del GeoJSON no es válido." }, { status: 400 });
    }

    const topType = geoParsed?.type;
    const geomType =
      topType === "FeatureCollection"
        ? geoParsed?.features?.[0]?.geometry?.type
        : geoParsed?.geometry?.type;

    if (!geomType) {
      return NextResponse.json({ message: "GeoJSON sin geometry.type" }, { status: 400 });
    }

    const nombreTipo = mapGeomToNombre(geomType);

    const [
      sqlGetIdEstadoEnEspera,
      sqlGetIdTipoGeojsonByNombre,
      sqlInsertLugar,
      sqlGetLastLugar,
      sqlInsertPuntoInteres,
      sqlGetLastPuntoInteres,
      sqlInsertImagen,
    ] = await Promise.all([
      readSQL("getIdEstadoEnEspera.sql"),
      readSQL("getIdTipoGeojsonByNombre.sql"),
      readSQL("insertLugar.sql"),
      readSQL("getLastLugar.sql"),
      readSQL("insertPuntoInteres.sql"),
      readSQL("getLastPuntoInteres.sql"),
      readSQL("insertImagen.sql"),
    ]);

    const rowEstado = query.get<{ id_estado_ubicacion_geografica: number }>(sqlGetIdEstadoEnEspera);
    if (!rowEstado?.id_estado_ubicacion_geografica) {
      return NextResponse.json({ message: "No existe estado 'en espera' en la BD" }, { status: 500 });
    }
    const id_estado_lugar = rowEstado.id_estado_ubicacion_geografica;

    const rowTipo = query.get<{ id_tipo_geojson: number }>(sqlGetIdTipoGeojsonByNombre, [nombreTipo]);
    if (!rowTipo?.id_tipo_geojson) {
      return NextResponse.json({ message: `tipo_geojson desconocido para '${nombreTipo}'` }, { status: 400 });
    }
    const id_tipo_geojson = rowTipo.id_tipo_geojson;

    query.run("BEGIN");

    query.run(sqlInsertLugar, [
      descripcion,
      JSON.stringify(geoParsed),
      id_tipo_geojson,
      id_estado_lugar,
    ]);
    const lastLugar = query.get<{ id_lugar: number }>(sqlGetLastLugar);
    if (!lastLugar?.id_lugar) {
      query.run("ROLLBACK");
      return NextResponse.json({ message: "No se pudo insertar el lugar" }, { status: 500 });
    }
    const id_lugar = lastLugar.id_lugar;

    const v1 = query.get(`SELECT 1 FROM tipo_lugar WHERE id_tipo_lugar = ? LIMIT 1;`, [punto.id_tipo_lugar]);
    const v2 = query.get(`SELECT 1 FROM campus WHERE id_campus = ? LIMIT 1;`, [punto.id_campus]);
    if (!v1 || !v2) {
      query.run("ROLLBACK");
      return NextResponse.json({ message: "FK inválida en tipo_lugar o campus" }, { status: 400 });
    }

    query.run(sqlInsertPuntoInteres, [
      punto.nombre,
      punto.id_tipo_lugar,
      punto.id_campus,
      id_lugar,
    ]);
    const lastPI = query.get<{ id_punto_interes: number }>(sqlGetLastPuntoInteres);
    if (!lastPI?.id_punto_interes) {
      query.run("ROLLBACK");
      return NextResponse.json({ message: "No se pudo insertar el punto de interés" }, { status: 500 });
    }

    const id_lugar_refactored = lastPI.id_punto_interes;

    query.run("INSERT INTO piso_lugar (numero_piso, fk_id_lugar) VALUES (?, ?);", [punto.piso_punto, id_lugar_refactored]);

    if (Array.isArray(imagenes) && imagenes.length > 0) {
      for (const [idx, img] of imagenes.entries()) {
        const match = img.base64.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!match) {
          query.run("ROLLBACK");
          return NextResponse.json({ message: `La imagen #${idx + 1} no tiene un formato base64 válido` }, { status: 400 });
        }

        const mime = match[1];
        const imageBuffer = Buffer.from(match[2], "base64");
        const descripcionImagen = img.descripcion?.trim() || null;

        query.run(sqlInsertImagen, [descripcionImagen, imageBuffer, id_lugar, mime]);
      }
    }

    query.run("COMMIT");

    return NextResponse.json({ id_lugar, id_punto_interes: lastPI.id_punto_interes }, { status: 201 });

  } catch (err: unknown) {
    try { query.run("ROLLBACK"); } catch {}
    console.error("[API] proponer lugar:", err);
    const message = err instanceof Error ? err.message : "Error al guardar";
    return NextResponse.json({ message }, { status: 400 });
  }
}
