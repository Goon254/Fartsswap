/**
 * Fartmaximizer™ Lab — shared types and ranking helpers.
 * Meal data is loaded from `/api/fartmaximizer/leaderboard`.
 */

import type { FartmaxMealDto, FartmaxVoteDirection } from '@/lib/farts-api-types';

export type FartmaximizerTier = 'defcon1' | 'severe' | 'elevated';

export type FartmaximizerFilter = 'all' | FartmaximizerTier;

export interface MealCombination {
  id: string;
  name: string;
  description: string;
  votes: number;
}

export const TIER_LABELS: Record<FartmaximizerTier, string> = {
  defcon1: 'DEFCON 1',
  severe: 'Severe',
  elevated: 'Elevated',
};

export function tierForRank(rank: number): FartmaximizerTier {
  if (rank <= 3) return 'defcon1';
  if (rank <= 10) return 'severe';
  return 'elevated';
}

export function mealMatchesFilter(rank: number, filter: FartmaximizerFilter): boolean {
  if (filter === 'all') return true;
  return tierForRank(rank) === filter;
}

export function mealsFromApi(rows: FartmaxMealDto[]): MealCombination[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    votes: row.votes,
  }));
}

export function sortMealsByVotes(meals: MealCombination[]): MealCombination[] {
  return [...meals].sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));
}

export function rankMap(meals: MealCombination[]): Map<string, number> {
  const sorted = sortMealsByVotes(meals);
  return new Map(sorted.map((meal, index) => [meal.id, index + 1]));
}

export type { FartmaxVoteDirection };
