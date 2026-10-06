import { fileURLToPath } from 'node:url';
import { LOCKS, lockSet } from '@pattern-lock/shared';
import { createApp } from './app.js';
import { InMemoryDayResultRepository } from './persistence/InMemoryDayResultRepository.js';

const port = Number(process.env.PORT ?? 3001);
const webDist = process.env.WEB_DIST ?? fileURLToPath(new URL('../../web/dist', import.meta.url));

// Swap in another DayResultRepository implementation here to persist across restarts.
const repository = new InMemoryDayResultRepository();

// Build the pattern lists up front (lock 3 takes a few hundred ms) so the first submit is fast.
LOCKS.forEach((_, i) => lockSet(i));

createApp({ repository, webDist }).listen(port, () => {
  console.log(`Pattern Lock API listening on http://localhost:${port}`);
});
