/** Express application factory: wires middleware, static files, and routes. */
import express from 'express';
import { PUBLIC_DIR } from './config.js';
import panelRoutes from './routes/panel.js';
import debateRoutes from './routes/debate.js';

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '256kb' }));
  app.use(express.static(PUBLIC_DIR));

  app.use('/api', panelRoutes);
  app.use('/api', debateRoutes);

  return app;
}
