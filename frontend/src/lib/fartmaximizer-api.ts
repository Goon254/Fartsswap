import { assertOk } from '@/lib/report-from-recording-api';
import type {
  FartmaxMealDto,
  FartmaxVoteDirection,
  FartmaximizerLeaderboardResponse,
} from '@/lib/farts-api-types';

export async function fetchFartmaximizerLeaderboard(
  limit = 50,
): Promise<FartmaximizerLeaderboardResponse> {
  const cap = Math.min(Math.max(limit, 1), 100);
  const res = await fetch(`/api/fartmaximizer/leaderboard?limit=${cap}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });
  return assertOk<FartmaximizerLeaderboardResponse>(res);
}

export async function submitFartmaxMeal(args: {
  name: string;
  description?: string;
}): Promise<FartmaxMealDto> {
  const name = args.name.trim();
  if (!name) throw new Error('Meal combination name is required');
  const res = await fetch('/api/fartmaximizer/meals', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name,
      ...(args.description?.trim() ? { description: args.description.trim() } : {}),
    }),
  });
  return assertOk<FartmaxMealDto>(res);
}

export async function castFartmaxVote(
  mealId: string,
  direction: FartmaxVoteDirection,
): Promise<FartmaximizerLeaderboardResponse> {
  const id = mealId.trim();
  if (!id) throw new Error('Missing meal id');
  const res = await fetch(`/api/fartmaximizer/meals/${encodeURIComponent(id)}/vote`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ direction }),
  });
  return assertOk<FartmaximizerLeaderboardResponse>(res);
}
