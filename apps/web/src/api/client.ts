import type {
  DayKey, DayStatsDto, PlayerStatsDto, SubmitResultRequest, SubmitResultResponse,
} from '@slockle/shared';

export class ApiRequestError extends Error {
  constructor(readonly status: number, readonly code: string) {
    super(`API ${status}: ${code}`);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<{ status: number; body: T }> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body: body as T };
}

/** Sends a finished day. Resolves when the server holds a result for it (new or already there). */
export async function submitResult(date: DayKey, payload: SubmitResultRequest): Promise<SubmitResultResponse> {
  const { status, body } = await request<SubmitResultResponse & { error?: string }>(
    `/days/${date}/results`,
    { method: 'POST', body: JSON.stringify(payload) },
  );
  if (status === 201 || status === 409) return body;
  throw new ApiRequestError(status, body.error ?? 'unknown');
}

export async function getPlayerStats(playerId: string, today: DayKey): Promise<PlayerStatsDto> {
  const { status, body } = await request<PlayerStatsDto & { error?: string }>(
    `/players/${encodeURIComponent(playerId)}/stats?today=${today}`,
  );
  if (status !== 200) throw new ApiRequestError(status, body.error ?? 'unknown');
  return body;
}

export async function getDayStats(date: DayKey): Promise<DayStatsDto> {
  const { status, body } = await request<DayStatsDto & { error?: string }>(`/days/${date}/stats`);
  if (status !== 200) throw new ApiRequestError(status, body.error ?? 'unknown');
  return body;
}
