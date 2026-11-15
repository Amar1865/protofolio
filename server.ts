import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import adminRoutes from './src/routes/admin.ts';
import authRoutes from './src/routes/auth.ts';
import contactRoutes from './src/routes/contact.ts';
import investmentRoutes from './src/routes/investments.ts';
import marketNewsRoutes from './src/routes/marketNews.ts';
import reportRoutes from './src/routes/reports.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', authRoutes);
  app.use('/api', investmentRoutes);
  app.use('/api', adminRoutes);
  app.use('/api', contactRoutes);
  app.use('/api', marketNewsRoutes);
  app.use('/api', reportRoutes);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
