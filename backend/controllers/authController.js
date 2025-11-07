import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { logger } from '../utils/logger.js';
import { obterSegredoJwt } from '../utils/auth.js';

const ehHashBcrypt = (valor = '') =>
  valor.startsWith('$2a$') || valor.startsWith('$2b$') || valor.startsWith('$2y$');

export const login = async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email?.trim() || !password) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const [usuarios] = await db.query(
      'SELECT id, name, email, password, role FROM users WHERE email = ?',
      [email.trim()]
    );

    if (!usuarios.length) {
      return res.status(401).json({ message: 'E-mail não encontrado.' });
    }

    const usuario = usuarios[0];
    const senhaArmazenada = usuario.password ?? '';
    const senhaConfere = ehHashBcrypt(senhaArmazenada)
      ? await bcrypt.compare(password, senhaArmazenada)
      : senhaArmazenada === password;

    if (!senhaConfere) {
      return res.status(401).json({ message: 'Senha incorreta.' });
    }

    const token = jwt.sign(
      { id: usuario.id, role: usuario.role },
      obterSegredoJwt(),
      { expiresIn: '1d' }
    );

    return res.json({
      token,
      user: {
        id: usuario.id,
        name: usuario.name,
        role: usuario.role,
      },
    });
  } catch (erro) {
    logger.error('Erro ao realizar login.', {
      requestId: req.requestId,
      stack: erro.stack,
    });

    return res.status(500).json({
      message: 'Não foi possível realizar o login. Tente novamente.',
      requestId: req.requestId,
    });
  }
};
