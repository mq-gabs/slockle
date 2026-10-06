import { existsSync } from 'node:fs';
import path from 'node:path';
import express, { type Express } from 'express';
import { ResultService, type Clock } from './domain/ResultService.js';
import { StatsService } from './domain/StatsService.js';
import { apiRouter, errorHandler } from './http/routes.js';
import type { DayResultRepository } from './persistence/DayResultRepository.js';

export interface AppOptions {
  repository: DayResultRepository;
  now?: Clock;
  /** Built web app to serve at /, if any (production). In development Vite serves it. */
  webDist?: string;
}

export function createApp({ repository, now = () => new Date(), webDist }: AppOptions): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));

  app.use('/api', apiRouter({
    results: new ResultService(repository, now),
    stats: new StatsService(repository),
    now,
  }));
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'not-found' });
  });

  if (webDist && existsSync(webDist)) {
    app.use(express.static(webDist));
    // Single page app: any other GET serves index.html (e.g. /?d=2026-09-30 deep links).
    app.get('/{*path}', (_req, res) => res.sendFile(path.join(webDist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
