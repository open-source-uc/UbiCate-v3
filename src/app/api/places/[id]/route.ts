import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "node:path";
import { query } from "@/app/lib/db";
import type { FeatureCollection } from "geojson";
import type { Place, Image } from "@/app/types/placeType";
import MapUtils from "@/utils/MapUtils";

type DbPlaceRow = Place & { geojson: unknown };

const EMPTY_FC: FeatureCollection = { type: "FeatureCollection", features: [] };

export const runtime = "nodejs";

export async function PUT(req: NextRequest, context: any) {
  try {
    const params = await context.params;
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();

    // lee los SQL
    const updateLugarSQL = await fs.readFile(
      path.join(process.cwd(), "src/sql/updateLugar.sql"),
      "utf8"
    );
    const updateUbicacionSQL = await fs.readFile(
      path.join(process.cwd(), "src/sql/updateUbicacionGeografica.sql"),
      "utf8"
    );
    const updatePisoSQL = await fs.readFile(
      path.join(process.cwd(), "src/sql/updatePisoLugar.sql"),
      "utf8"
    );

    // obtiene id ubicacion
    const ubicacionRow = query.get<{ fk_id_ubicacion_geografica: number }>(
      "SELECT fk_id_ubicacion_geografica FROM lugar WHERE id_lugar = ?",
      [id]
    );
    const id_ubicacion_geografica = ubicacionRow?.fk_id_ubicacion_geografica;
    if (!id_ubicacion_geografica) {
      return NextResponse.json(
        { error: "Ubicación no encontrada" },
        { status: 404 }
      );
    }

    // updates
    query.run(updateLugarSQL, [
      body.nombre_lugar,
      body.id_campus,
      body.id_tipo_lugar,
      body.arquitecto,
      body.premio,
      body.facultad,
      id,
    ]);
    query.run(updateUbicacionSQL, [
      body.descripcion,
      typeof body.geojson === "string"
        ? body.geojson
        : JSON.stringify(body.geojson),
      body.nombre_tipo_geojson,
      id_ubicacion_geografica,
    ]);
    query.run(updatePisoSQL, [body.piso_punto, id]);

    // imágenes eliminadas
    for (const idImg of body.imagenesEliminadas ?? []) {
      query.run("DELETE FROM imagen WHERE id_imagen = ?", [idImg]);
    }

    // imágenes editadas
    for (const edit of body.imagenesEditadas ?? []) {
      query.run("UPDATE imagen SET descripcion = ? WHERE id_imagen = ?", [
        edit.descripcion,
        edit.id,
      ]);
    }

    // imágenes nuevas
    for (const nueva of body.nuevasImagenes ?? []) {
      let base64 = nueva.base64;
      const match = base64.match(/^data:([\w\-\/]+);base64,(.*)$/);
      let mime_type = "image/jpeg";
      if (match) {
        mime_type = match[1];
        base64 = match[2];
      }
      const imageBuffer = Buffer.from(base64, "base64");
      query.run(
        "INSERT INTO imagen (fk_id_ubicacion_geografica, binario, descripcion, mime_type) VALUES (?, ?, ?, ?)",
        [id_ubicacion_geografica, imageBuffer, nueva.descripcion || "", mime_type]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DB] Error actualizando lugar:", err);
    return NextResponse.json(
      { error: "Error actualizando BD" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, context: any) {
  try {
    const params = await context.params;
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const place_sql = await fs.readFile(
      path.join(process.cwd(), "src/sql/getPlaceById.sql"),
      "utf8"
    );
    const image_sql = await fs.readFile(
      path.join(process.cwd(), "src/sql/getPlaceImages.sql"),
      "utf8"
    );

    const placeRow = query.get<DbPlaceRow>(place_sql, [id]);
    if (!placeRow) {
      return NextResponse.json(
        { error: "Lugar no encontrado" },
        { status: 404 }
      );
    }

    const imageRows = query.all<Image>(image_sql, [
      placeRow.id_ubicacion_geografica,
    ]);

    const descripcion = placeRow.descripcion || (placeRow as any).ug_descripcion;
    const fc = MapUtils.toFeatureCollection(placeRow.geojson) ?? EMPTY_FC;

    return NextResponse.json({
      ...placeRow,
      descripcion,
      featureCollection: fc,
      images: imageRows.map((img) => ({
        ...img,
        binario: `data:${img.mime_type};base64,${Buffer.from(img.binario).toString("base64")}`,
      })),
    });
  } catch (err) {
    console.error("[DB] Error get place:", err);
    return NextResponse.json(
      { error: "Error consultando BD" },
      { status: 500 }
    );
  }
}
