import jwt from 'jsonwebtoken';
import { obterSegredoJwt } from '../utils/auth.js';
import { logger } from '../utils/logger.js';

const extrairToken = (req) => req.headers.authorization?.split(' ')[1];

export const verifyToken = (req, res, next) => {
  const token = extrairToken(req);

  if (!token) {
    return res.status(403).json({ message: 'Token não fornecido.' });
  }

  try {
    req.user = jwt.verify(token, obterSegredoJwt());
    return next();
  } catch (erro) {
    logger.warn('Token inválido ou expirado.', {
      requestId: req.requestId,
      stack: erro.stack,
    });

    return res.status(401).json({
      message: 'Token inválido ou expirado.',
      requestId: req.requestId,
    });
  }
};

const ordemPermissoes = ['viewer', 'comercial', 'editor', 'admin'];

export const requireRole = (roles = []) => (req, res, next) => {
  if (!req.user?.role) {
    logger.warn('Usuário autenticado sem perfil associado.', {
      requestId: req.requestId,
    });
    return res.status(403).json({ message: 'Sem permissão.' });
  }

  if (!roles.length || roles.includes(req.user.role)) {
    return next();
  }

  logger.warn('Usuário sem permissão para acessar o recurso.', {
    requestId: req.requestId,
    role: req.user.role,
    rolesNecessarias: roles,
  });

  return res.status(403).json({ message: 'Sem permissão.' });
};

export const requireRoleAtLeast = (minimo) => (req, res, next) => {
  if (!req.user?.role) {
    logger.warn('Usuário autenticado sem perfil associado.', {
      requestId: req.requestId,
    });
    return res.status(403).json({ message: 'Sem permissão.' });
  }

  const posicaoAtual = ordemPermissoes.indexOf(req.user.role);
  const posicaoMinima = ordemPermissoes.indexOf(minimo);

  if (posicaoAtual >= posicaoMinima) {
    return next();
  }

  logger.warn('Usuário não possui o nível mínimo de permissão.', {
    requestId: req.requestId,
    role: req.user.role,
    minimo,
  });

  return res.status(403).json({ message: 'Sem permissão.' });
};
