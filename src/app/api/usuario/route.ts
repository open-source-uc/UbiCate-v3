export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { query } from "../../lib/db";
type UsuarioRow = {
  id_usuario: number;
  uid: string | null;
  nombres: string | null;
  apellidos: string | null;
};
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get("uid");
  if (!uid) return NextResponse.json({ error: "Falta ?uid" }, { status: 400 });
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
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    const payload = {
      uid: (row.uid ?? "").trim(),
      nombres: (row.nombres ?? "").trim() || null,
      apellidos: (row.apellidos ?? "").trim() || null,
    };
    const res = NextResponse.json(payload, { status: 200 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e) {
    console.error("[DB] Error:", e);
    return NextResponse.json({ error: "Error consultando BD" }, { status: 500 });
  }
}