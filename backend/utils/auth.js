import { logger } from './logger.js';

let segredoJwtPadrao;

export const obterSegredoJwt = () => {
  const configurado = process.env.JWT_SECRET?.trim();

  if (configurado) {
    return configurado;
  }

  if (!segredoJwtPadrao) {
    segredoJwtPadrao = 'segredo-desenvolvimento';
    logger.warn(
      'JWT_SECRET não definido; utilizando segredo temporário apenas para desenvolvimento.'
    );
  }

  return segredoJwtPadrao;
};
