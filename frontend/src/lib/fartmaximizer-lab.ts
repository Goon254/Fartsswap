/**
 * Community meal-combination leaderboard for the Fartmaximizer™ Lab section.
 * Client-only for now; votes live in React state on the landing page.
 */

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

export const INITIAL_MEAL_COMBINATIONS: MealCombination[] = [
  {
    id: 'm01',
    name: 'Airport Chili + Seat Warmer + Hubris',
    description: 'Filed after a gate change and zero accountability.',
    votes: 2847,
  },
  {
    id: 'm02',
    name: 'Inherited Casserole + Family Group Chat',
    description: 'Emotional damage compounds the fiber load.',
    votes: 2712,
  },
  {
    id: 'm03',
    name: 'Competitive Cheese Flight + Farmer’s Market Ego',
    description: 'Sampled eleven wedges “for research.”',
    votes: 2598,
  },
  {
    id: 'm04',
    name: 'Burrito Before Yoga + False Confidence',
    description: 'The instructor asked you to leave with dignity.',
    votes: 2411,
  },
  {
    id: 'm05',
    name: 'True-Crime Binge + Unnamed Crunchy Snacks',
    description: 'Episode seven unlocked something primal.',
    votes: 2289,
  },
  {
    id: 'm06',
    name: 'Reply-All Lunch + Passive-Aggressive Salad',
    description: 'HR has been notified via methane.',
    votes: 2156,
  },
  {
    id: 'm07',
    name: 'Thrift-Store Windbreaker + Gas Station Tuna Melt',
    description: 'Confidence was synthetic; consequences were not.',
    votes: 2033,
  },
  {
    id: 'm08',
    name: 'Double Espresso + Forgot You Already Had Coffee',
    description: 'The nervous system filed a countersuit.',
    votes: 1988,
  },
  {
    id: 'm09',
    name: 'Karaoke Wings + Song You Do Not Know',
    description: 'Vibrato triggered downstream turbulence.',
    votes: 1874,
  },
  {
    id: 'm10',
    name: 'Museum Gift Shop Samples + No Meal Plan',
    description: 'Culture was consumed; dignity was not.',
    votes: 1762,
  },
  {
    id: 'm11',
    name: 'Thermostat War Chili + Roommate Who Loves Winter',
    description: 'Domestic climate policy met digestive policy.',
    votes: 1640,
  },
  {
    id: 'm12',
    name: 'Escape Room Burrito + Claustrophobic Timer',
    description: 'The team solved nothing except ventilation.',
    votes: 1522,
  },
  {
    id: 'm13',
    name: 'Influencer Smoothie + Misspelled Superfoods',
    description: 'Spirulina was spelled wrong on purpose.',
    votes: 1418,
  },
  {
    id: 'm14',
    name: 'Parallel Parking Audience + Nervous Takeout',
    description: 'Three strangers witnessed the entire arc.',
    votes: 1305,
  },
  {
    id: 'm15',
    name: 'Wikipedia Submarines at 1am + Salted Crackers',
    description: 'Depth of research exceeded depth of judgment.',
    votes: 1199,
  },
  {
    id: 'm16',
    name: 'Garage Sale Lava Lamp + Discount Hot Dogs',
    description: 'Negotiation skills did not transfer to digestion.',
    votes: 1088,
  },
  {
    id: 'm17',
    name: 'Podcast at 2x Speed + Meal Prep Revenge',
    description: 'Productivity poisoned the break room.',
    votes: 977,
  },
  {
    id: 'm18',
    name: 'Dog Walked You + Questionable Street Taco',
    description: 'The leash was not the only thing pulled.',
    votes: 864,
  },
  {
    id: 'm19',
    name: 'Pre-Interview Power Pose + Garlic Knots',
    description: 'Confidence peaked before the elevator did.',
    votes: 752,
  },
  {
    id: 'm20',
    name: 'Rain Delay Nachos + Sport You Did Not Watch',
    description: 'Atmospheric pressure changed indoors.',
    votes: 641,
  },
];

export function sortMealsByVotes(meals: MealCombination[]): MealCombination[] {
  return [...meals].sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));
}

export function rankMap(meals: MealCombination[]): Map<string, number> {
  const sorted = sortMealsByVotes(meals);
  return new Map(sorted.map((meal, index) => [meal.id, index + 1]));
}
