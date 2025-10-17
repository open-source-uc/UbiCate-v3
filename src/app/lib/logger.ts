// ...existing code...
import winston from 'winston';

// evitar fallo en build si winston-syslog no está o no tiene tipos
let Syslog: any = null;
try {
  const mod = await import('winston-syslog');
  Syslog = mod?.Syslog || mod;
} catch {
  // no syslog disponible, seguir con consola
}

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} ${level}: ${message}${metaStr}`;
});

// Preferir las variables que te pasaron; fallback a las previas si existen
const syslogHost = process.env.LOG_SYSLOG_IP;
const syslogPort = Number(process.env.LOG_SYSLOG_PORT);
const syslogProgram = process.env.LOG_SYSLOG_PROGRAM;

const syslogOpts = {
  host: syslogHost,
  port: syslogPort,
  protocol: (process.env.SYSLOG_PROTOCOL || 'udp4'),
  app_name: syslogProgram,
  localhost: process.env.SYSLOG_LOCALHOST || undefined
};

const consoleTransport = new winston.transports.Console({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(colorize(), timestamp(), logFormat)
});

let syslogTransport: any = null;
if (Syslog && syslogHost) {
  try {
    syslogTransport = new Syslog({
      level: process.env.SYSLOG_LEVEL || process.env.LOG_LEVEL || 'info',
      ...syslogOpts
    });
  } catch {
    // si falla, continuar solo con consola
    // opcional: console.error('syslog init error', e);
  }
}

const transports = [consoleTransport];
if (syslogTransport) transports.push(syslogTransport);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp(), logFormat),
  transports
});

export default logger;