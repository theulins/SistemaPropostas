import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { createLogger, format, transports } from 'winston';

const { combine, timestamp, errors, splat, printf, colorize } = format;

const diretorioLogs = path.resolve(process.cwd(), 'logs');
fs.mkdirSync(diretorioLogs, { recursive: true });

const formatarMensagem = printf(({ timestamp: data, level, message, requestId, stack, ...metadados }) => {
  const contextoRequisicao = requestId ? ` [req:${requestId}]` : '';
  const detalhesExtras = Object.keys(metadados).length ? ` ${JSON.stringify(metadados)}` : '';
  const conteudo = stack ?? message;

  return `${data} ${level}${contextoRequisicao}: ${conteudo}${detalhesExtras}`;
});

export const logger = createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), splat(), formatarMensagem),
  transports: [
    new transports.File({ filename: path.join(diretorioLogs, 'app.log') }),
    new transports.Console({
      format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), formatarMensagem),
    }),
  ],
  exitOnError: false,
});

export const withRequestId = (req, res, next) => {
  req.requestId = req.requestId ?? randomUUID();
  res.locals.requestId = req.requestId;
  next();
};

export const requestLogger = (req, res, next) => {
  const inicio = Date.now();

  res.on('finish', () => {
    const duracao = Date.now() - inicio;
    logger.info(`HTTP ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duracao}ms)`, {
      requestId: req.requestId,
    });
  });

  next();
};
