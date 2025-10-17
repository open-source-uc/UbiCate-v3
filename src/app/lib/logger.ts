// ...existing code...
// Logger seguro para entornos isomórficos.
// Carga winston / winston-syslog solo en servidor (require dinámico) para evitar que
// bundlers del cliente intenten resolver dependencias node-only como `unix-dgram`.

type LoggerShape = {
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug?: (...args: any[]) => void;
};

const isServer = typeof window === 'undefined';

let logger: LoggerShape;

if (isServer) {
  // require dinámico (usando eval para evitar que linters / bundlers lo analicen estáticamente)
  const req: any = (globalThis as any).require || eval("typeof require !== 'undefined' ? require : undefined");
  const winston: any = req ? req('winston') : null;

  let Syslog: any = null;
  if (req) {
    try {
      const mod = req('winston-syslog');
      Syslog = mod?.Syslog || mod;
    } catch (err: any) {
      // winston-syslog no está disponible en este entorno: seguiremos con consola
      // registrar el mensaje corto para diagnóstico en servidor
  const errMsg = err && (err as any).message ? (err as any).message : String(err);
  console.error('winston-syslog require failed:', errMsg);
      Syslog = null;
    }
  }

  const { combine, timestamp, printf, colorize } = winston.format;

  const logFormat = printf(({ level, message, timestamp, ...meta }: any) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${metaStr}`;
  });

  // Preferir las variables LOG_SYSLOG_* y caer a las antiguas si no existen
  const syslogHost = process.env.LOG_SYSLOG_IP || process.env.SYSLOG_HOST || undefined;
  const syslogPort = Number(process.env.LOG_SYSLOG_PORT || process.env.SYSLOG_PORT || 514);
  const syslogProgram = process.env.LOG_SYSLOG_PROGRAM || process.env.SYSLOG_APP || 'UbiCate';
  const syslogProtocol = process.env.SYSLOG_PROTOCOL || process.env.LOG_SYSLOG_PROTOCOL || 'udp4';

  const consoleTransport = new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(colorize(), timestamp(), logFormat)
  });

  let syslogTransport: any = null;
  if (Syslog && syslogHost) {
    try {
      syslogTransport = new Syslog({
        level: process.env.SYSLOG_LEVEL || process.env.LOG_LEVEL || 'info',
        host: syslogHost,
        port: syslogPort,
        protocol: syslogProtocol,
        app_name: syslogProgram,
        localhost: process.env.SYSLOG_LOCALHOST || undefined
      });
    } catch (e: any) {
      // If syslog transport fails, fall back to console only
  const errMsg = e && e.message ? e.message : String(e);
  console.error('winston-syslog init error:', errMsg);
    }
  }

  const transports: any[] = [consoleTransport];
  if (syslogTransport) transports.push(syslogTransport);

  const winstonLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(timestamp(), logFormat),
    transports
  });

  logger = {
    info: (...a: any[]) => winstonLogger.info(...a),
    warn: (...a: any[]) => winstonLogger.warn(...a),
    error: (...a: any[]) => winstonLogger.error(...a),
    debug: (...a: any[]) => (winstonLogger.debug ? winstonLogger.debug(...a) : winstonLogger.info(...a))
  };
} else {
  // Cliente: stub liviano que usa console (sin dependencias node-only)
  logger = {
    info: (...a: any[]) => console.info('[info]', ...a),
    warn: (...a: any[]) => console.warn('[warn]', ...a),
    error: (...a: any[]) => console.error('[error]', ...a),
    debug: (...a: any[]) => (console.debug ? console.debug('[debug]', ...a) : console.log('[debug]', ...a))
  };
}

export default logger;