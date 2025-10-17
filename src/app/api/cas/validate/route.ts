export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import xml2js from "xml2js";
import { query } from "../../../lib/db";
import logger from "../../../lib/logger";

// ==== Tipos mínimos del XML de CAS ====
type CasAttributes = { uid?: string; apellidos?: string; givenName?: string };
type CasAuthSuccess = { user?: string; attributes?: CasAttributes };

// ==== Utils ====
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

function getAuthSuccess(parsed: unknown): CasAuthSuccess | null {
  if (!isRecord(parsed)) return null;
  const sr = parsed["serviceResponse"];
  if (!isRecord(sr)) return null;
  const ok = sr["authenticationSuccess"];
  return isRecord(ok) ? (ok as CasAuthSuccess) : null;
}

export async function POST(req: NextRequest) {
  const { ticket, service } = await req.json();
  logger.info(`Validando el CAS ticket para el service`);
  if (!ticket || !service) {
    logger.warn("Faltan parámetros en la solicitud de validación CAS");
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    // 1) Validar CAS (externo)
    const casValidateUrl =
      `https://sso-lib.uc.cl/cas/serviceValidate?ticket=${encodeURIComponent(ticket)}&service=${encodeURIComponent(service)}`;

    const casRes = await axios.get<string>(casValidateUrl, {
      timeout: 10_000,
      validateStatus: () => true,
      headers: { Accept: "application/xml" },
    });

    if (casRes.status < 200 || casRes.status >= 300) {
      logger.warn(`CAS service validado ha fallado: ${casRes.status}`);
      return NextResponse.json(
        { error: "CAS serviceValidate failed", status: casRes.status },
        { status: 401 }
      );
    }

    const parser = new xml2js.Parser({
      explicitArray: false,
      tagNameProcessors: [xml2js.processors.stripPrefix],
    });

    let parsedUnknown: unknown;
    try {
      parsedUnknown = await parser.parseStringPromise(casRes.data);
    } catch {
      logger.error("Error al parsear el CAS XML response"); 
      return NextResponse.json({ error: "CAS XML parse error" }, { status: 502 });
    }

    const success = getAuthSuccess(parsedUnknown);
    if (!success) {
      logger.warn("La autentificación del CAS falló");
      return NextResponse.json({ error: "CAS authentication failed" }, { status: 401 });
    }

    const uid: string | undefined = success.attributes?.uid || success.user;
    if (!uid) {
      logger.warn("El payload del CAS no contiene uid");
      return NextResponse.json({ error: "CAS payload missing uid" }, { status: 400 });
    }

    // 2) Consultar usuario en BD (usando BD_PATH)
    // Ajusta nombres de tabla/campos si difieren: usuario(uid, nombre, id, ...)
    const user = query.get<{ id: number; uid: string; nombre?: string }>(
      "SELECT id_usuario, uid, nombres FROM usuario WHERE uid = ? LIMIT 1",
      [uid]
    );

    if (!user) {
      logger.warn(`Usuario con uid ${uid} no se encuentra registrado en el sistema`);
      return NextResponse.json(
        { error: "Usted no se encuentra registrado en el sistema", redirectTo: "/" },
        { status: 403 }
      );
    }
    logger.info(`Usuario ${uid} autenticado exitosamente via CAS`);
    const res = NextResponse.json(
      { authenticationSuccess: success, user },
      { status: 200 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("Error interno en la validación CAS", { error: msg });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
