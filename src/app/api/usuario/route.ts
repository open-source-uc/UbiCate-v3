export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { query } from "../../lib/db";
import logger from "@/app/lib/logger";

type UsuarioRow = {
  id_usuario: number;
  uid: string | null;
  nombres: string | null;
  apellidos: string | null;
};
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get("uid");
  if (!uid) {
    logger.error("Falta uid");
    return NextResponse.json({ error: "Falta uid" }, { status: 400 });
  }
  try {
    const row = query.get<UsuarioRow>(
      `
      SELECT id_usuario, uid, nombres, apellidos
      FROM usuario
      WHERE lower(trim(uid)) = lower(trim(?))
      LIMIT 1
      `,
      [uid]
    );
    if (!row) {
      logger.error("Usuario no encontrado");
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    const payload = {
      uid: (row.uid ?? "").trim(),
      nombres: (row.nombres ?? "").trim() || null,
      apellidos: (row.apellidos ?? "").trim() || null,
    };
    const res = NextResponse.json(payload, { status: 200 });
    res.headers.set("Cache-Control", "no-store");
    logger.info("Usuario obtenido por UID:", payload);
    return res;
  } catch (e) {
    logger.error("[DB] Error:", e);
    return NextResponse.json({ error: "Error consultando BD" }, { status: 500 });
  }
}