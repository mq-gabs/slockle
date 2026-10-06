import {
  dateKey, utcDayNumber,
  type ApiError, type DayResultDto, type DayStatsDto, type PlayerStatsDto, type SubmitResultResponse,
} from '@slockle/shared';
import { Router, type ErrorRequestHandler, type Response } from 'express';
import { z } from 'zod';
import type { DayResult } from '../domain/DayResult.js';
import { DomainError } from '../domain/errors.js';
import type { Clock, ResultService } from '../domain/ResultService.js';
import type { StatsService } from '../domain/StatsService.js';
import { dateParam, playerId, playerStatsQuery, submitBody } from './schemas.js';

export interface RouteDeps {
  results: ResultService;
  stats: StatsService;
  now: Clock;
}

const toDto = (r: DayResult): DayResultDto => ({ ...r, submittedAt: r.submittedAt.toISOString() });

export function apiRouter({ results, stats, now }: RouteDeps): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  router.post('/days/:date/results', async (req, res: Response<SubmitResultResponse>) => {
    const date = dateParam.parse(req.params.date);
    const body = submitBody.parse(req.body);
    const { created, result } = await results.submit({ date, ...body });
    res.status(created ? 201 : 409).json({ result: toDto(result) });
  });

  router.get('/days/:date/stats', async (req, res: Response<DayStatsDto>) => {
    res.json(await stats.dayStats(dateParam.parse(req.params.date)));
  });

  router.get('/players/:playerId/stats', async (req, res: Response<PlayerStatsDto>) => {
    const id = playerId.parse(req.params.playerId);
    const { today } = playerStatsQuery.parse(req.query);
    res.json(await stats.playerStats(id, today ?? dateKey(utcDayNumber(now()))));
  });

  return router;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const send = (status: number, body: ApiError) => res.status(status).json(body);
  if (err instanceof z.ZodError) return send(400, { error: 'invalid-request', details: z.flattenError(err) });
  if (err instanceof DomainError) return send(err.status, { error: err.code, details: err.details });
  if (err?.type === 'entity.parse.failed') return send(400, { error: 'invalid-json' });
  console.error(err);
  return send(500, { error: 'internal' });
};
