import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';

import { withRequestId, requestLogger, logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import companiesRoutes from './routes/companies.js';
import associatesRoutes from './routes/associates.js';
import proposalsRoutes from './routes/proposals.js';
import usersRoutes from './routes/users.js';
import configRoutes from './routes/config.js';
import cnpjRoutes from './routes/cnpj.js';
import exportRoutes from './routes/export.js';

dotenv.config();

const app = express();

app.disable('x-powered-by');
app.use(withRequestId);
app.use((_, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '20mb' }));
app.use(requestLogger);

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/empresas', companiesRoutes);
app.use('/api/associates', associatesRoutes);
app.use('/api/proposals', proposalsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/config', configRoutes);
app.use('/api/cnpj', cnpjRoutes);
app.use('/api/export', exportRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada.', requestId: req.requestId });
});

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => logger.info(`Servidor disponível na porta ${PORT}`));
