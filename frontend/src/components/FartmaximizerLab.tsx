'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  type FC,
  type FormEvent,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { Chip } from '@/components/Chip';
import { SectionLabel } from '@/components/SectionLabel';
import {
  INITIAL_MEAL_COMBINATIONS,
  type FartmaximizerFilter,
  type FartmaximizerTier,
  type MealCombination,
  TIER_LABELS,
  mealMatchesFilter,
  rankMap,
  sortMealsByVotes,
  tierForRank,
} from '@/lib/fartmaximizer-lab';
import { fadeUp, transitionBrand } from '@/lib/motion';

type RankFlash = 'up' | 'down';

const FILTER_OPTIONS: { id: FartmaximizerFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'defcon1', label: TIER_LABELS.defcon1 },
  { id: 'severe', label: TIER_LABELS.severe },
  { id: 'elevated', label: TIER_LABELS.elevated },
];

const TIER_STYLES: Record<
  FartmaximizerTier,
  { border: string; accent: string; chip: 'red' | 'amber' | 'green' }
> = {
  defcon1: {
    border: 'border-[color-mix(in_oklab,var(--color-alert-red)_55%,transparent)]',
    accent: 'text-[var(--color-alert-red)]',
    chip: 'red',
  },
  severe: {
    border: 'border-[color-mix(in_oklab,var(--color-alert-amber)_50%,transparent)]',
    accent: 'text-[var(--color-alert-amber)]',
    chip: 'amber',
  },
  elevated: {
    border: 'border-[color-mix(in_oklab,var(--color-alert-green)_45%,transparent)]',
    accent: 'text-[var(--color-alert-green)]',
    chip: 'green',
  },
};

function formatVotes(count: number): string {
  return count.toLocaleString('en-US');
}

/**
 * Community-powered meal-combination leaderboard (landing §II).
 * Votes and submissions are client-only until a backend exists.
 */
export const FartmaximizerLab: FC = () => {
  const [meals, setMeals] = useState<MealCombination[]>(INITIAL_MEAL_COMBINATIONS);
  const [filter, setFilter] = useState<FartmaximizerFilter>('all');
  const [submitName, setSubmitName] = useState('');
  const [submitDescription, setSubmitDescription] = useState('');
  const [flashById, setFlashById] = useState<Record<string, RankFlash>>({});

  const ranked = useMemo(() => sortMealsByVotes(meals), [meals]);

  const applyVote = useCallback((id: string, delta: 1 | -1) => {
    setMeals((current) => {
      const beforeRanks = rankMap(current);
      const next = current.map((meal) =>
        meal.id === id ? { ...meal, votes: Math.max(0, meal.votes + delta) } : meal,
      );
      const afterRanks = rankMap(next);

      const flashes: Record<string, RankFlash> = {};
      for (const meal of next) {
        const before = beforeRanks.get(meal.id);
        const after = afterRanks.get(meal.id);
        if (before !== undefined && after !== undefined && before !== after) {
          flashes[meal.id] = after < before ? 'up' : 'down';
        }
      }

      if (Object.keys(flashes).length > 0) {
        setFlashById((prev) => ({ ...prev, ...flashes }));
        window.setTimeout(() => {
          setFlashById((prev) => {
            const cleared = { ...prev };
            for (const key of Object.keys(flashes)) delete cleared[key];
            return cleared;
          });
        }, 900);
      }

      return next;
    });
  }, []);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const name = submitName.trim();
    if (!name) return;

    const description =
      submitDescription.trim() ||
      'Community filing pending Bureau review. Assume maximum volatility.';

    setMeals((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        name,
        description,
        votes: 0,
      },
    ]);
    setSubmitName('');
    setSubmitDescription('');
  };

  const podium = ranked.slice(0, 3);
  const second = podium[1];
  const first = podium[0];
  const third = podium[2];

  const listEntries = ranked
    .map((meal, index) => ({ meal, rank: index + 1 }))
    .filter(({ rank }) => rank >= 4 && rank <= 20)
    .filter(({ rank }) => mealMatchesFilter(rank, filter));

  return (
    <section className="relative border-t border-[var(--border-subtle)]">
      <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <motion.header
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          transition={transitionBrand}
          className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="max-w-2xl">
            <SectionLabel index="II">BUREAU RESEARCH DIVISION</SectionLabel>
            <h2 className="mt-5 font-display text-3xl leading-tight tracking-tight text-[var(--text-strong)] sm:text-4xl lg:text-[2.75rem]">
              The Fartmaximizer™ Lab
            </h2>
            <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-[var(--text-default)] sm:text-base">
              A community-powered toxicity index. Field agents vote on meal combinations
              hypothesised to produce superior acoustic outcomes. Rankings update in real time.
              No nutrition advice. Immense peer-review energy.
            </p>
            <p className="mt-3 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
              Directive AGD-441 · Meal Matrix · Community attestations
            </p>
          </div>
          <Chip tone="teal" withDot className="self-start lg:self-auto">
            Live rankings
          </Chip>
        </motion.header>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          transition={transitionBrand}
          className="mt-10 flex flex-wrap items-center gap-2"
          role="tablist"
          aria-label="Filter rankings by threat tier"
        >
          {FILTER_OPTIONS.map((option) => {
            const active = filter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(option.id)}
                className={[
                  'rounded-sm px-3 py-2 font-mono text-[0.62rem] uppercase tracking-wide-3 transition-colors',
                  active
                    ? 'bg-[color-mix(in_oklab,var(--accent-brass)_14%,transparent)] text-[var(--accent-brass)] ring-1 ring-inset ring-[var(--border-brass)]'
                    : 'bg-[var(--bg-panel)] text-[var(--text-muted)] ring-1 ring-inset ring-[var(--border-subtle)] hover:text-[var(--text-strong)]',
                ].join(' ')}
              >
                {option.label}
              </button>
            );
          })}
        </motion.div>

        {(filter === 'all' || filter === 'defcon1') && first && second && third ? (
          <div className="mt-12 grid grid-cols-1 items-end gap-4 sm:grid-cols-3 sm:gap-5">
            <PodiumSlot
              meal={second}
              rank={2}
              placement="left"
              flash={flashById[second.id]}
              onUpvote={() => applyVote(second.id, 1)}
              onDownvote={() => applyVote(second.id, -1)}
            />
            <PodiumSlot
              meal={first}
              rank={1}
              placement="center"
              flash={flashById[first.id]}
              onUpvote={() => applyVote(first.id, 1)}
              onDownvote={() => applyVote(first.id, -1)}
            />
            <PodiumSlot
              meal={third}
              rank={3}
              placement="right"
              flash={flashById[third.id]}
              onUpvote={() => applyVote(third.id, 1)}
              onDownvote={() => applyVote(third.id, -1)}
            />
          </div>
        ) : (
          <p className="mt-12 rounded-md border border-dashed border-[var(--border-subtle)] bg-[var(--bg-panel)] px-4 py-8 text-center font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            No DEFCON 1 entries in current rankings. Select All to view the full matrix.
          </p>
        )}

        <div className="mt-12 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-panel)]">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3 sm:px-5">
            <span className="font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              Ranks 4–20 · Scrollable attestations
            </span>
            <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
              {listEntries.length} visible
            </span>
          </div>
          <ol className="max-h-[28rem] overflow-y-auto overscroll-contain">
            <AnimatePresence initial={false} mode="popLayout">
              {listEntries.length === 0 ? (
                <li className="px-5 py-10 text-center font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
                  No entries in this tier band.
                </li>
              ) : (
                listEntries.map(({ meal, rank }) => (
                  <RankListRow
                    key={meal.id}
                    meal={meal}
                    rank={rank}
                    flash={flashById[meal.id]}
                    onUpvote={() => applyVote(meal.id, 1)}
                    onDownvote={() => applyVote(meal.id, -1)}
                  />
                ))
              )}
            </AnimatePresence>
          </ol>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-10 rounded-md border border-[var(--border-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_4%,transparent)] p-5 sm:p-6"
        >
          <h3 className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--text-strong)]">
            § Submit new combination
          </h3>
          <p className="mt-2 max-w-[48ch] text-sm text-[var(--text-default)]">
            Propose a meal matrix for community review. Descriptions are optional but encouraged
            for Bureau context.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
                Meal combination
              </span>
              <input
                value={submitName}
                onChange={(e) => setSubmitName(e.target.value)}
                placeholder="e.g. Wedding Buffet + Open Bar + Speech"
                className="mt-1.5 w-full rounded-sm border border-[var(--border-stark)] bg-[var(--bg-panel)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--accent-brass)] focus:ring-1 focus:ring-[var(--accent-brass)]"
                maxLength={120}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
                Field notes (optional)
              </span>
              <input
                value={submitDescription}
                onChange={(e) => setSubmitDescription(e.target.value)}
                placeholder="One-line Bureau commentary"
                className="mt-1.5 w-full rounded-sm border border-[var(--border-stark)] bg-[var(--bg-panel)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--accent-brass)] focus:ring-1 focus:ring-[var(--accent-brass)]"
                maxLength={160}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={!submitName.trim()}
            className="mt-4 rounded-sm bg-[var(--accent-brass)] px-5 py-2.5 font-mono text-[0.65rem] uppercase tracking-wide-2 text-[var(--bg-base)] transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
          >
            File with the Bureau
          </button>
        </form>
      </div>
    </section>
  );
};

interface PodiumSlotProps {
  meal: MealCombination;
  rank: number;
  placement: 'left' | 'center' | 'right';
  flash?: RankFlash;
  onUpvote: () => void;
  onDownvote: () => void;
}

const PODIUM_HEIGHT: Record<number, string> = {
  1: 'min-h-[15.5rem] sm:min-h-[18rem]',
  2: 'min-h-[12.5rem] sm:min-h-[14.5rem]',
  3: 'min-h-[11rem] sm:min-h-[13rem]',
};

const PodiumSlot: FC<PodiumSlotProps> = ({
  meal,
  rank,
  placement,
  flash,
  onUpvote,
  onDownvote,
}) => {
  const tier = tierForRank(rank);
  const style = TIER_STYLES[tier];
  const order =
    placement === 'center'
      ? 'order-1 sm:order-2'
      : placement === 'left'
        ? 'order-2 sm:order-1'
        : 'order-3 sm:order-3';

  return (
    <motion.article
      layout
      layoutId={`meal-${meal.id}`}
      className={`flex flex-col ${order}`}
      animate={
        flash === 'up'
          ? {
              boxShadow: [
                '0 0 0 0 transparent',
                '0 0 0 2px color-mix(in oklab, var(--color-alert-green) 70%, transparent)',
                '0 0 0 0 transparent',
              ],
              y: [0, -6, 0],
            }
          : flash === 'down'
            ? {
                boxShadow: [
                  '0 0 0 0 transparent',
                  '0 0 0 2px color-mix(in oklab, var(--color-alert-red) 70%, transparent)',
                  '0 0 0 0 transparent',
                ],
                y: [0, 6, 0],
              }
            : { y: 0 }
      }
      transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <div
        className={[
          'flex flex-1 flex-col rounded-md border bg-[var(--bg-panel-strong)] p-4 sm:p-5',
          style.border,
          PODIUM_HEIGHT[rank],
          placement === 'center' ? 'sm:-mt-4' : '',
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className={`font-display text-4xl leading-none tracking-tight sm:text-5xl ${style.accent}`}
          >
            #{rank}
          </span>
          <Chip tone={style.chip}>{TIER_LABELS[tier]}</Chip>
        </div>
        <h3 className="mt-4 font-display text-lg leading-snug tracking-tight text-[var(--text-strong)] sm:text-xl">
          {meal.name}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-default)]">
          {meal.description}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4">
          <span className="font-mono text-[0.72rem] tracking-wide-2 text-[var(--text-muted)]">
            <span className={style.accent}>{formatVotes(meal.votes)}</span> attestations
          </span>
          <VoteControls onUpvote={onUpvote} onDownvote={onDownvote} compact />
        </div>
      </div>
      <div
        aria-hidden="true"
        className={[
          'mx-2 mt-2 h-3 rounded-b-sm border border-t-0 bg-[var(--bg-elevated)]',
          style.border,
          placement === 'center' ? 'h-4' : 'h-2',
        ].join(' ')}
      />
    </motion.article>
  );
};

interface RankListRowProps {
  meal: MealCombination;
  rank: number;
  flash?: RankFlash;
  onUpvote: () => void;
  onDownvote: () => void;
}

const RankListRow: FC<RankListRowProps> = ({ meal, rank, flash, onUpvote, onDownvote }) => {
  const tier = tierForRank(rank);
  const style = TIER_STYLES[tier];

  return (
    <motion.li
      layout
      layoutId={`meal-${meal.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={
        flash === 'up'
          ? {
              opacity: 1,
              y: [8, -4, 0],
              backgroundColor: [
                'color-mix(in oklab, var(--color-alert-green) 0%, transparent)',
                'color-mix(in oklab, var(--color-alert-green) 12%, transparent)',
                'color-mix(in oklab, var(--color-alert-green) 0%, transparent)',
              ],
            }
          : flash === 'down'
            ? {
                opacity: 1,
                y: [0, 4, 0],
                backgroundColor: [
                  'color-mix(in oklab, var(--color-alert-red) 0%, transparent)',
                  'color-mix(in oklab, var(--color-alert-red) 12%, transparent)',
                  'color-mix(in oklab, var(--color-alert-red) 0%, transparent)',
                ],
              }
            : { opacity: 1, y: 0 }
      }
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
      className={[
        'grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-4 sm:grid-cols-[3.5rem_1fr_auto] sm:gap-4 sm:px-5',
        'last:border-b-0',
      ].join(' ')}
    >
      <div className="flex flex-col items-center gap-1">
        <span className={`font-display text-2xl leading-none ${style.accent}`}>#{rank}</span>
        <Chip tone={style.chip} className="!px-1.5 !py-0.5 !text-[0.5rem]">
          {TIER_LABELS[tier]}
        </Chip>
      </div>
      <div className="min-w-0">
        <h4 className="font-display text-base leading-snug tracking-tight text-[var(--text-strong)] sm:text-lg">
          {meal.name}
        </h4>
        <p className="mt-1 text-sm leading-relaxed text-[var(--text-default)]">{meal.description}</p>
        <p className="mt-2 font-mono text-[0.62rem] tracking-wide-2 text-[var(--text-muted)]">
          {formatVotes(meal.votes)} attestations
        </p>
      </div>
      <VoteControls onUpvote={onUpvote} onDownvote={onDownvote} />
    </motion.li>
  );
};

interface VoteControlsProps {
  onUpvote: () => void;
  onDownvote: () => void;
  compact?: boolean;
}

const VoteControls: FC<VoteControlsProps> = ({ onUpvote, onDownvote, compact }) => (
  <div
    className={`flex flex-col gap-1 ${compact ? '' : 'sm:flex-row sm:items-center'}`}
    role="group"
    aria-label="Vote on this meal combination"
  >
    <button
      type="button"
      onClick={onUpvote}
      aria-label="Upvote"
      className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-2.5 py-1.5 font-mono text-[0.7rem] text-[var(--color-alert-green)] transition-colors hover:border-[color-mix(in_oklab,var(--color-alert-green)_40%,transparent)] hover:bg-[color-mix(in_oklab,var(--color-alert-green)_8%,transparent)]"
    >
      ▲
    </button>
    <button
      type="button"
      onClick={onDownvote}
      aria-label="Downvote"
      className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-2.5 py-1.5 font-mono text-[0.7rem] text-[var(--color-alert-red)] transition-colors hover:border-[color-mix(in_oklab,var(--color-alert-red)_40%,transparent)] hover:bg-[color-mix(in_oklab,var(--color-alert-red)_8%,transparent)]"
    >
      ▼
    </button>
  </div>
);
