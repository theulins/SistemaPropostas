import { logger } from '../utils/logger.js';

export const errorHandler = (erro, req, res, _next) => {
  logger.error('Erro não tratado durante a requisição.', {
    requestId: req.requestId,
    stack: erro.stack,
  });

  if (res.headersSent) {
    return;
  }

  const status = erro.statusCode ?? erro.status ?? 500;
  const mensagemUsuario =
    erro.userMessage ?? 'Ocorreu um erro interno. Tente novamente mais tarde.';

  res.status(status).json({
    message: mensagemUsuario,
    requestId: req.requestId,
  });
};
