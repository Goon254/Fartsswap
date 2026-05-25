'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  type FC,
  type FormEvent,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { Chip } from '@/components/Chip';
import { AnimatedVoteCount } from '@/components/fartmaximizer/AnimatedVoteCount';
import { FartmaximizerVoteButton } from '@/components/fartmaximizer/FartmaximizerVoteButton';
import { LethalAura } from '@/components/fartmaximizer/LethalAura';
import { SectionLabel } from '@/components/SectionLabel';
import {
  INITIAL_MEAL_COMBINATIONS,
  type FartmaxVoteDirection,
  type FartmaximizerFilter,
  type FartmaximizerTier,
  type MealCombination,
  TIER_LABELS,
  mealMatchesFilter,
  rankMap,
  sortMealsByVotes,
  tierForRank,
} from '@/lib/fartmaximizer-lab';
import { hapticRankShift, hapticSubmit, hapticTap } from '@/lib/fartmaximizer-haptics';
import { fadeUp, staggerParent, transitionBrand } from '@/lib/motion';

type RankFlash = 'up' | 'down';

const FILTER_OPTIONS: { id: FartmaximizerFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'defcon1', label: TIER_LABELS.defcon1 },
  { id: 'severe', label: TIER_LABELS.severe },
  { id: 'elevated', label: TIER_LABELS.elevated },
];

const TIER_STYLES: Record<
  FartmaximizerTier,
  {
    border: string;
    accent: string;
    chip: 'red' | 'amber' | 'green';
    glow: string;
    hoverGlow: string;
  }
> = {
  defcon1: {
    border: 'border-[color-mix(in_oklab,var(--color-alert-red)_65%,transparent)]',
    accent: 'text-[var(--color-alert-red)]',
    chip: 'red',
    glow: 'shadow-[0_0_40px_color-mix(in_oklab,var(--color-alert-red)_28%,transparent)]',
    hoverGlow:
      'hover:shadow-[0_0_48px_color-mix(in_oklab,var(--color-alert-red)_38%,transparent)]',
  },
  severe: {
    border: 'border-[color-mix(in_oklab,var(--color-alert-amber)_55%,transparent)]',
    accent: 'text-[var(--color-alert-amber)]',
    chip: 'amber',
    glow: 'shadow-[0_0_24px_color-mix(in_oklab,var(--color-alert-amber)_18%,transparent)]',
    hoverGlow:
      'hover:shadow-[0_0_32px_color-mix(in_oklab,var(--color-alert-amber)_26%,transparent)]',
  },
  elevated: {
    border: 'border-[color-mix(in_oklab,var(--color-alert-green)_45%,transparent)]',
    accent: 'text-[var(--color-alert-green)]',
    chip: 'green',
    glow: 'shadow-[0_0_18px_color-mix(in_oklab,var(--color-alert-green)_14%,transparent)]',
    hoverGlow:
      'hover:shadow-[0_0_26px_color-mix(in_oklab,var(--color-alert-green)_22%,transparent)]',
  },
};

const PODIUM_HEIGHT: Record<number, string> = {
  1: 'min-h-[16.5rem] sm:min-h-[20rem]',
  2: 'min-h-[13rem] sm:min-h-[15.5rem]',
  3: 'min-h-[11.5rem] sm:min-h-[14rem]',
};

interface FartmaximizerLabProps {
  standalone?: boolean;
}

export const FartmaximizerLab: FC<FartmaximizerLabProps> = ({ standalone = false }) => {
  const reduceMotion = useReducedMotion();
  const [meals, setMeals] = useState<MealCombination[]>(INITIAL_MEAL_COMBINATIONS);
  const [myVotes, setMyVotes] = useState<Record<string, FartmaxVoteDirection>>({});
  const [filter, setFilter] = useState<FartmaximizerFilter>('all');
  const [submitName, setSubmitName] = useState('');
  const [submitDescription, setSubmitDescription] = useState('');
  const [flashById, setFlashById] = useState<Record<string, RankFlash>>({});

  const ranked = useMemo(() => sortMealsByVotes(meals), [meals]);

  const applyVote = useCallback((id: string, direction: FartmaxVoteDirection) => {
    const delta = direction === 'up' ? 1 : -1;
    setMyVotes((prev) => ({ ...prev, [id]: direction }));

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
        hapticRankShift();
        setFlashById((prev) => ({ ...prev, ...flashes }));
        window.setTimeout(() => {
          setFlashById((prev) => {
            const cleared = { ...prev };
            for (const key of Object.keys(flashes)) delete cleared[key];
            return cleared;
          });
        }, 1100);
      }

      return next;
    });
  }, []);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const name = submitName.trim();
    if (!name) return;
    hapticSubmit();

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
  const [first, second, third] = podium;
  const listEntries = ranked
    .map((meal, index) => ({ meal, rank: index + 1 }))
    .filter(({ rank }) => rank >= 4 && rank <= 20)
    .filter(({ rank }) => mealMatchesFilter(rank, filter));

  const TitleTag = standalone ? 'h1' : 'h2';
  const showPodium = (filter === 'all' || filter === 'defcon1') && first && second && third;

  return (
    <section
      className={[
        'fartmaximizer-lab relative',
        standalone ? '' : 'border-t border-[var(--border-subtle)]',
      ].join(' ')}
    >
      <div
        className={
          standalone
            ? 'relative mx-auto w-full max-w-7xl px-6 pb-24 pt-8 lg:px-10 lg:pb-32 lg:pt-10'
            : 'relative mx-auto w-full max-w-7xl px-6 py-20 lg:px-10 lg:py-28'
        }
      >
        <motion.header
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          transition={transitionBrand}
          className="relative flex flex-col gap-6 overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between"
        >
          {!reduceMotion ? (
            <div
              aria-hidden="true"
              className="fartmax-hazard-scan pointer-events-none absolute inset-0 opacity-60"
            />
          ) : null}
          <div className="relative max-w-2xl">
            <SectionLabel index={standalone ? 'I' : 'II'}>BUREAU RESEARCH DIVISION</SectionLabel>
            <TitleTag className="mt-5 font-display text-3xl leading-tight tracking-tight text-[var(--text-strong)] text-shadow-glow sm:text-4xl lg:text-[2.85rem]">
              The Fartmaximizer™ Lab
            </TitleTag>
            <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-[var(--text-default)] sm:text-base">
              A community-powered toxicity index. Field agents vote on meal combinations
              hypothesised to produce superior acoustic outcomes. Rankings update in real time.
            </p>
            <p className="mt-3 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
              Directive AGD-441 · Meal Matrix · Community attestations
            </p>
          </div>
          <motion.div
            className="relative self-start lg:self-auto"
            animate={reduceMotion ? undefined : { scale: [1, 1.03, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Chip tone="teal" withDot>
              Live rankings
            </Chip>
          </motion.div>
        </motion.header>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          transition={transitionBrand}
          className="relative mt-10 flex flex-wrap items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] p-2"
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
                onClick={() => {
                  hapticTap();
                  setFilter(option.id);
                }}
                className="relative rounded-sm px-4 py-2.5 font-mono text-[0.62rem] uppercase tracking-wide-3 transition-colors"
              >
                {active ? (
                  <motion.span
                    layoutId="fartmax-filter-pill"
                    className="absolute inset-0 rounded-sm bg-[color-mix(in_oklab,var(--accent-brass)_18%,transparent)] ring-1 ring-inset ring-[var(--border-brass)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                ) : null}
                <span
                  className={
                    active
                      ? 'relative text-[var(--accent-brass)]'
                      : 'relative text-[var(--text-muted)] hover:text-[var(--text-strong)]'
                  }
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </motion.div>

        {showPodium ? (
          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            className="relative mt-14 overflow-hidden rounded-lg border border-[color-mix(in_oklab,var(--color-alert-red)_25%,var(--border-subtle))] bg-[color-mix(in_oklab,var(--color-alert-red)_4%,var(--bg-panel))] p-4 sm:p-6"
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <span className="font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--color-alert-red)]">
                DEFCON 1 · Lethality podium
              </span>
              <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
                Center rank = most lethal
              </span>
            </div>
            <div className="grid grid-cols-1 items-end gap-5 sm:grid-cols-3 sm:gap-6">
              <PodiumSlot
                meal={second}
                rank={2}
                placement="left"
                flash={flashById[second.id]}
                onUpvote={() => void applyVote(second.id, 'up')}
                onDownvote={() => void applyVote(second.id, 'down')}
                myVote={myVotes[second.id]}
              />
              <PodiumSlot
                meal={first}
                rank={1}
                placement="center"
                flash={flashById[first.id]}
                onUpvote={() => void applyVote(first.id, 'up')}
                onDownvote={() => void applyVote(first.id, 'down')}
                myVote={myVotes[first.id]}
              />
              <PodiumSlot
                meal={third}
                rank={3}
                placement="right"
                flash={flashById[third.id]}
                onUpvote={() => void applyVote(third.id, 'up')}
                onDownvote={() => void applyVote(third.id, 'down')}
                myVote={myVotes[third.id]}
              />
            </div>
          </motion.div>
        ) : (
          <p className="mt-12 rounded-md border border-dashed border-[var(--border-subtle)] bg-[var(--bg-panel)] px-4 py-8 text-center font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            No DEFCON 1 entries in current rankings. Select All to view the full matrix.
          </p>
        )}

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          transition={transitionBrand}
          className="mt-12 overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-[0_12px_48px_color-mix(in_oklab,black_35%,transparent)]"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-4 py-3 sm:px-5">
            <span className="font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              Ranks 4–20 · Scrollable attestations
            </span>
            <motion.span
              key={listEntries.length}
              className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
            >
              {listEntries.length} visible
            </motion.span>
          </div>
          <ol className="max-h-[32rem] overflow-y-auto overscroll-contain scroll-smooth">
            <AnimatePresence initial={false} mode="popLayout">
              {listEntries.length === 0 ? (
                <li className="px-5 py-12 text-center font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
                  No entries in this tier band.
                </li>
              ) : (
                listEntries.map(({ meal, rank }, index) => (
                  <RankListRow
                    key={meal.id}
                    meal={meal}
                    rank={rank}
                    index={index}
                    flash={flashById[meal.id]}
                    onUpvote={() => void applyVote(meal.id, 'up')}
                    onDownvote={() => void applyVote(meal.id, 'down')}
                    myVote={myVotes[meal.id]}
                  />
                ))
              )}
            </AnimatePresence>
          </ol>
        </motion.div>

        <motion.form
          onSubmit={onSubmit}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          transition={transitionBrand}
          className="mt-10 overflow-hidden rounded-md border border-[var(--border-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_6%,var(--bg-panel))] p-5 sm:p-6"
        >
          <h3 className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--text-strong)]">
            § Submit new combination
          </h3>
          <p className="mt-2 max-w-[48ch] text-sm text-[var(--text-default)]">
            Propose a meal matrix for community review.
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
                className="mt-1.5 w-full rounded-sm border border-[var(--border-stark)] bg-[var(--bg-panel)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition-shadow placeholder:text-[var(--text-faint)] focus:border-[var(--accent-brass)] focus:shadow-[0_0_20px_var(--glow-brass)] focus:ring-1 focus:ring-[var(--accent-brass)]"
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
                className="mt-1.5 w-full rounded-sm border border-[var(--border-stark)] bg-[var(--bg-panel)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none transition-shadow placeholder:text-[var(--text-faint)] focus:border-[var(--accent-brass)] focus:shadow-[0_0_20px_var(--glow-brass)] focus:ring-1 focus:ring-[var(--accent-brass)]"
                maxLength={160}
              />
            </label>
          </div>
          <motion.button
            type="submit"
            disabled={!submitName.trim()}
            whileHover={reduceMotion ? undefined : { scale: 1.02, y: -1 }}
            whileTap={reduceMotion ? undefined : { scale: 0.96, y: 1 }}
            className="mt-4 rounded-sm bg-[var(--accent-brass)] px-6 py-3 font-mono text-[0.65rem] uppercase tracking-wide-2 text-[var(--bg-base)] shadow-[0_4px_0_color-mix(in_oklab,black_35%,transparent)] transition-opacity disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
          >
            File with the Bureau
          </motion.button>
        </motion.form>
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
  myVote?: FartmaxVoteDirection;
}

const PodiumSlot: FC<PodiumSlotProps> = ({
  meal,
  rank,
  placement,
  flash,
  onUpvote,
  onDownvote,
  myVote,
}) => {
  const reduceMotion = useReducedMotion();
  const tier = tierForRank(rank);
  const style = TIER_STYLES[tier];
  const lethal = rank === 1;
  const order =
    placement === 'center'
      ? 'order-1 sm:order-2'
      : placement === 'left'
        ? 'order-2 sm:order-1'
        : 'order-3';

  const card = (
    <motion.div
      layout
      layoutId={`meal-${meal.id}`}
      className={[
        'fartmax-card-alive relative flex flex-1 flex-col overflow-hidden rounded-md border p-4 sm:p-5',
        style.border,
        style.glow,
        style.hoverGlow,
        PODIUM_HEIGHT[rank],
        lethal
          ? 'bg-[linear-gradient(165deg,color-mix(in_oklab,var(--color-alert-red)_16%,var(--bg-panel-strong)),var(--bg-panel-strong))]'
          : 'bg-[var(--bg-panel-strong)]',
        placement === 'center' && !lethal ? 'sm:-mt-2' : '',
        lethal ? 'sm:-mt-6 sm:scale-[1.03]' : '',
      ].join(' ')}
      animate={
        flash === 'up'
          ? {
              boxShadow: [
                '0 0 0 0 transparent',
                '0 0 32px color-mix(in oklab, var(--color-alert-green) 45%, transparent)',
                '0 0 0 0 transparent',
              ],
              y: [0, -10, 0],
            }
          : flash === 'down'
            ? {
                boxShadow: [
                  '0 0 0 0 transparent',
                  '0 0 28px color-mix(in oklab, var(--color-alert-red) 40%, transparent)',
                  '0 0 0 0 transparent',
                ],
                y: [0, 8, 0],
              }
            : undefined
      }
      transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {lethal && !reduceMotion ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,transparent,var(--color-alert-red),var(--color-alert-amber),var(--color-alert-red),transparent)] opacity-90"
        />
      ) : null}
      <div className="flex items-start justify-between gap-2">
        <motion.span
          className={`font-display leading-none tracking-tight ${style.accent} ${
            lethal ? 'text-5xl sm:text-6xl' : 'text-4xl sm:text-5xl'
          }`}
          animate={lethal && !reduceMotion ? { scale: [1, 1.04, 1] } : undefined}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          #{rank}
        </motion.span>
        <Chip tone={style.chip}>{TIER_LABELS[tier]}</Chip>
      </div>
      <h3
        className={`mt-4 font-display leading-snug tracking-tight text-[var(--text-strong)] ${
          lethal ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
        }`}
      >
        {meal.name}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-default)]">
        {meal.description}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4">
        <span className="font-mono text-[0.72rem] tracking-wide-2 text-[var(--text-muted)]">
          <AnimatedVoteCount
            count={meal.votes}
            lethal={lethal}
            className={`${style.accent} font-semibold`}
          />{' '}
          attestations
        </span>
        <VoteControls
          onUpvote={onUpvote}
          onDownvote={onDownvote}
          compact
          lethalContext={lethal}
          myVote={myVote}
        />
      </div>
    </motion.div>
  );

  return (
    <motion.article
      variants={fadeUp}
      className={`flex flex-col ${order}`}
    >
      <LethalAura active={lethal} className="flex flex-1 flex-col">
        {card}
      </LethalAura>
      <motion.div
        aria-hidden="true"
        layout
        className={[
          'mx-3 mt-2 rounded-b-sm border border-t-0 bg-[var(--bg-elevated)]',
          style.border,
          lethal ? 'h-5 shadow-[0_8px_24px_color-mix(in_oklab,var(--color-alert-red)_25%,transparent)]' : 'h-2.5',
        ].join(' ')}
      />
    </motion.article>
  );
};

interface RankListRowProps {
  meal: MealCombination;
  rank: number;
  index: number;
  flash?: RankFlash;
  onUpvote: () => void;
  onDownvote: () => void;
  myVote?: FartmaxVoteDirection;
}

const RankListRow: FC<RankListRowProps> = ({
  meal,
  rank,
  index,
  flash,
  onUpvote,
  onDownvote,
  myVote,
}) => {
  const tier = tierForRank(rank);
  const style = TIER_STYLES[tier];

  return (
    <motion.li
      layout
      layoutId={`meal-${meal.id}`}
      initial={{ opacity: 0, x: -12 }}
      animate={
        flash === 'up'
          ? {
              opacity: 1,
              x: [0, 4, 0],
              backgroundColor: [
                'transparent',
                'color-mix(in oklab, var(--color-alert-green) 14%, transparent)',
                'transparent',
              ],
            }
          : flash === 'down'
            ? {
                opacity: 1,
                x: [0, -4, 0],
                backgroundColor: [
                  'transparent',
                  'color-mix(in oklab, var(--color-alert-red) 12%, transparent)',
                  'transparent',
                ],
              }
            : { opacity: 1, x: 0 }
      }
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1], delay: index * 0.02 }}
      whileHover={{ x: 4 }}
      className={[
        'fartmax-card-alive grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-4 sm:grid-cols-[4rem_1fr_auto] sm:gap-5 sm:px-5',
        'border-l-[3px]',
        style.border.replace('border-', 'border-l-'),
        style.glow,
        'last:border-b-0',
      ].join(' ')}
    >
      <div className="flex flex-col items-center gap-1.5">
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
          <AnimatedVoteCount count={meal.votes} className={`${style.accent} font-semibold`} />{' '}
          attestations
        </p>
      </div>
      <VoteControls
        onUpvote={onUpvote}
        onDownvote={onDownvote}
        myVote={myVote}
      />
    </motion.li>
  );
};

interface VoteControlsProps {
  onUpvote: () => void;
  onDownvote: () => void;
  compact?: boolean;
  lethalContext?: boolean;
  myVote?: FartmaxVoteDirection;
}

const VoteControls: FC<VoteControlsProps> = ({
  onUpvote,
  onDownvote,
  compact,
  lethalContext,
  myVote,
}) => (
  <div
    className={`flex gap-1.5 ${compact ? 'flex-col' : 'flex-row sm:items-center'}`}
    role="group"
    aria-label="Vote on this meal combination"
  >
    <FartmaximizerVoteButton
      kind="up"
      onVote={onUpvote}
      lethalContext={lethalContext}
      compact={compact}
      active={myVote === 'up'}
    />
    <FartmaximizerVoteButton
      kind="down"
      onVote={onDownvote}
      compact={compact}
      active={myVote === 'down'}
    />
  </div>
);
