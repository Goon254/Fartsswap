'use client';

import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { Chip } from '@/components/Chip';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { Navbar } from '@/components/Navbar';
import { SeedIntakePanel } from '@/components/SeedIntakePanel';
import { SeedLinkPanel } from '@/components/SeedLinkPanel';
import { SeedOutputPanel, type SurfaceToggles } from '@/components/SeedOutputPanel';
import { SeedPreviewPane } from '@/components/SeedPreviewPane';
import { SeedVariantPanel } from '@/components/SeedVariantPanel';
import { pageView, track } from '@/lib/analytics';
import { createChallenge, createChallengeLink } from '@/lib/challenge';
import { RESULT_VARIANTS, type ResultVariant, type ThreatLevel } from '@/lib/result-variants';
import {
  applySeedOverridesToVariant,
  createSeedLink,
  createSeedPayload,
  serializeSeedPayload,
  type PlatformPreset,
  type SeedPayload,
  type SeedSurface,
  type TargetType,
} from '@/lib/seed';

const EASE = [0.22, 0.61, 0.36, 1] as const;
const DEFAULT_VARIANT = RESULT_VARIANTS[0];

/**
 * /seed orchestrator.
 *
 * Operator-side state machine. The component owns every input the four
 * panels read from and every callback they write into, so the children
 * stay dumb and reusable.
 *
 * Composition:
 *   §I    SeedIntakePanel    target / type / platform / notes
 *   §II   SeedVariantPanel   classification / score / threat / caption
 *   §III  SeedOutputPanel    per-surface toggle list
 *   §IV   SeedPreviewPane    live dossier preview (override-aware)
 *   §V    SeedLinkPanel      generated URLs + outreach captions
 *
 * Analytics:
 *   `seed_tool_view`            once on mount
 *   `seed_target_configured`    on target / type / platform changes (debounced)
 *   `seed_variant_adjusted`     on each variant-level tuning event
 *   `seed_output_selected`      on each surface toggle
 *   `seed_link_generated`       on every newly-composed link set (debounced)
 *   `seed_link_copied`          on Copy URL / Copy pitch
 *   `seed_preview_opened`       on Open Preview
 */
export const SeedToolClient: FC = () => {
  // — Form state —
  const [targetLabel, setTargetLabel] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('creator');
  const [platform, setPlatform] = useState<PlatformPreset>('none');
  const [notes, setNotes] = useState('');

  const [activeVariantId, setActiveVariantId] = useState<string>(DEFAULT_VARIANT.id);
  const [powerScore, setPowerScore] = useState<number>(DEFAULT_VARIANT.powerScore);
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>(DEFAULT_VARIANT.threatLevel);
  const [captionIndex, setCaptionIndex] = useState<number>(0);

  const [toggles, setToggles] = useState<SurfaceToggles>({
    report: true,
    share: true,
    challenge: false,
  });

  // — Page view —
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    pageView('seed_tool_view', {});
  }, []);

  // — When the variant changes, pull its defaults into the override fields
  //   so the operator starts from "as recorded" rather than the previous
  //   variant's overrides. This keeps the slider/threat/caption sensible
  //   while still letting the operator tune from there. —
  useEffect(() => {
    const v = RESULT_VARIANTS.find((x) => x.id === activeVariantId);
    if (!v) return;
    setPowerScore(v.powerScore);
    setThreatLevel(v.threatLevel);
    setCaptionIndex(0);
  }, [activeVariantId]);

  // — Derived state —
  const baseVariant = useMemo<ResultVariant>(
    () =>
      RESULT_VARIANTS.find((v) => v.id === activeVariantId) ?? DEFAULT_VARIANT,
    [activeVariantId],
  );

  const payload = useMemo<SeedPayload>(
    () =>
      createSeedPayload({
        targetLabel,
        targetType,
        powerScore,
        threatLevel,
        captionIndex,
        platform,
      }),
    [targetLabel, targetType, powerScore, threatLevel, captionIndex, platform],
  );

  const overriddenVariant = useMemo(
    () => applySeedOverridesToVariant(baseVariant, payload),
    [baseVariant, payload],
  );

  const hasOverrides = overriddenVariant !== baseVariant;

  // — Build all candidate hrefs. The challenge link rides our
  //   existing challenge.ts serializer so the rival score / classification
  //   propagate correctly when /challenge parses the URL. —
  const hrefs = useMemo<Record<SeedSurface, string>>(() => {
    const challengeBase = createChallenge({
      variant: overriddenVariant,
      sourceSurface: 'share',
    });
    const challengePath = createChallengeLink(challengeBase, { preview: true });
    // Append our own seed params on top of the challenge link so the
    // operator-chosen target label travels with it for analytics.
    const challengeUrl = (() => {
      const sp = serializeSeedPayload(payload);
      if (sp.toString().length === 0) return challengePath;
      const sep = challengePath.includes('?') ? '&' : '?';
      return `${challengePath}${sep}${sp.toString()}`;
    })();

    return {
      report: createSeedLink('report', baseVariant.id, payload, { from: 'seed' }),
      share: createSeedLink('share', baseVariant.id, payload, { from: 'seed' }),
      challenge: challengeUrl,
    };
  }, [baseVariant.id, overriddenVariant, payload]);

  // — Analytics: target configuration changes —
  const targetSnapshot = useRef<{ label: string; type: TargetType; platform: PlatformPreset } | null>(
    null,
  );
  useEffect(() => {
    const next = { label: targetLabel, type: targetType, platform };
    if (
      !targetSnapshot.current ||
      targetSnapshot.current.label !== next.label ||
      targetSnapshot.current.type !== next.type ||
      targetSnapshot.current.platform !== next.platform
    ) {
      targetSnapshot.current = next;
      track('seed_target_configured', {
        targetType: next.type,
        hasLabel: next.label.trim().length > 0,
        platform: next.platform,
      });
    }
  }, [targetLabel, targetType, platform]);

  // — Analytics: variant-tuning changes (each field fires its own event) —
  const variantSnapshot = useRef<{
    variantId: string;
    score: number;
    threat: ThreatLevel;
    caption: number;
  } | null>(null);
  useEffect(() => {
    const next = {
      variantId: activeVariantId,
      score: powerScore,
      threat: threatLevel,
      caption: captionIndex,
    };
    const prev = variantSnapshot.current;
    variantSnapshot.current = next;
    if (!prev) return;
    if (prev.variantId !== next.variantId) {
      track('seed_variant_adjusted', { variantId: next.variantId, field: 'classification' });
      return;
    }
    if (prev.score !== next.score) {
      track('seed_variant_adjusted', { variantId: next.variantId, field: 'score' });
    }
    if (prev.threat !== next.threat) {
      track('seed_variant_adjusted', { variantId: next.variantId, field: 'threat' });
    }
    if (prev.caption !== next.caption) {
      track('seed_variant_adjusted', { variantId: next.variantId, field: 'caption' });
    }
  }, [activeVariantId, powerScore, threatLevel, captionIndex]);

  // — Analytics: link set generation (single debounced event per active
  //   surface set). Avoids the spam of firing once per keystroke while
  //   still capturing the "operator generated a packet" moment. —
  const linksSnapshot = useRef<string>('');
  useEffect(() => {
    const enabled = (Object.keys(toggles) as SeedSurface[]).filter((s) => toggles[s]);
    const sig = enabled.map((s) => `${s}:${hrefs[s]}`).join('|');
    if (sig === linksSnapshot.current) return;
    linksSnapshot.current = sig;
    if (enabled.length === 0) return;
    enabled.forEach((surface) => {
      track('seed_link_generated', {
        surface,
        variantId: baseVariant.id,
        hasOverrides,
      });
    });
  }, [toggles, hrefs, baseVariant.id, hasOverrides]);

  // — Toggle handler with analytics —
  const onToggle = useCallback((surface: SeedSurface, enabled: boolean) => {
    setToggles((prev) => ({ ...prev, [surface]: enabled }));
    track('seed_output_selected', { surface, enabled });
  }, []);

  // — Copy / preview callbacks for the link panel —
  const onLinkCopied = useCallback((surface: SeedSurface, kind: 'url' | 'pitch') => {
    track('seed_link_copied', { surface, kind });
  }, []);
  const onPreviewOpened = useCallback((surface: SeedSurface, variantId: string) => {
    track('seed_preview_opened', { surface, variantId });
  }, []);

  return (
    <>
      <BackgroundLayers />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />

        <main className="flex-1">
          <ConsoleHeader hasOverrides={hasOverrides} />

          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-6 pb-16 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:px-10 lg:pb-24">
            {/* — Workstation column — */}
            <div className="flex flex-col gap-6">
              <SeedIntakePanel
                targetLabel={targetLabel}
                onTargetLabelChange={setTargetLabel}
                targetType={targetType}
                onTargetTypeChange={setTargetType}
                platform={platform}
                onPlatformChange={setPlatform}
                notes={notes}
                onNotesChange={setNotes}
              />
              <SeedVariantPanel
                activeVariantId={activeVariantId}
                onVariantChange={setActiveVariantId}
                powerScore={powerScore}
                onPowerScoreChange={setPowerScore}
                threatLevel={threatLevel}
                onThreatLevelChange={setThreatLevel}
                captionIndex={captionIndex}
                onCaptionIndexChange={setCaptionIndex}
              />
              <SeedOutputPanel toggles={toggles} onToggle={onToggle} />
            </div>

            {/* — Output column. Sticky on lg so the preview + links stay
                in view while the operator scrolls through the workstation. — */}
            <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
              <SeedPreviewPane variant={overriddenVariant} targetType={targetType} />
              <SeedLinkPanel
                variant={overriddenVariant}
                payload={payload}
                toggles={toggles}
                hrefs={hrefs}
                onLinkCopied={onLinkCopied}
                onPreviewOpened={onPreviewOpened}
              />
            </div>
          </div>
        </main>

        <FooterLoreStrip />
      </div>
    </>
  );
};

interface ConsoleHeaderProps {
  hasOverrides: boolean;
}

const ConsoleHeader: FC<ConsoleHeaderProps> = ({ hasOverrides }) => (
  <motion.section
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: EASE }}
    className="mx-auto w-full max-w-7xl px-6 pt-8 lg:px-10 lg:pt-12"
  >
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-[var(--border-stark)] bg-[color-mix(in_oklab,var(--bg-panel-strong)_85%,transparent)] px-5 py-3">
      <div className="flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
        <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
        <span className="text-[var(--accent-brass)]">CREATIVE OPS · DISPATCH DESK</span>
        <span aria-hidden="true" className="hidden h-3 w-px bg-[var(--border-stark)] md:inline-block" />
        <span className="hidden md:inline">Internal seeding toolkit · Bureau use</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="brass">DESK · §10.4</Chip>
        {hasOverrides ? (
          <Chip tone="amber" withDot>
            LIVE OVERRIDES
          </Chip>
        ) : (
          <Chip tone="neutral">UNSEEDED · BASE VARIANT</Chip>
        )}
      </div>
    </div>

    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
      <div>
        <div className="flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
          <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
            §X
          </span>
          <span>CREATOR SEEDING TOOLKIT · ISSUE DOSSIER</span>
        </div>
        <h1
          className={[
            'mt-4 max-w-[20ch] font-display font-medium leading-[1.02] tracking-tight',
            'text-[var(--text-strong)] text-shadow-glow',
            'text-[2.4rem] sm:text-[3rem] md:text-[3.6rem] lg:text-[4rem]',
          ].join(' ')}
        >
          Prepare specimen.{' '}
          <span className="italic text-[var(--accent-brass)]">Issue dossier.</span> Dispatch.
        </h1>
        <p className="mt-5 max-w-[58ch] text-[0.95rem] leading-relaxed text-[var(--text-default)]">
          Operator console for assembling custom seeded artifacts. Configure a target, tune the
          acoustic profile, pick the outbound surfaces. The Bureau will compose copy-ready URLs and
          platform-aware outreach captions. No backend, no persistence — every dispatch leaves on a
          link.
        </p>
      </div>

      <div className="rounded-md border border-dashed border-[var(--border-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_4%,transparent)] p-5">
        <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
          OPERATOR GUIDANCE
        </div>
        <ol className="mt-3 grid grid-cols-1 gap-2 text-[0.85rem] leading-snug text-[var(--text-default)]">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className="flex gap-2 before:font-mono before:text-[0.6rem] before:font-medium before:uppercase before:tracking-wide-3 before:text-[var(--accent-brass)]"
              style={{ counterReset: `step ${i + 1}` }}
            >
              <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
                §{i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  </motion.section>
);

const STEPS = [
  'Designate the target. Creators, brands, meme accounts, and custom subjects are admissible.',
  'Pick a base variant. Tune the acoustic profile to taste — score, threat level, featured caption.',
  'Pick the outbound artifact surfaces. The dossier and the share card cover most seeding needs.',
  'Copy the URL and the outreach caption. The recipient will see the overrides applied at the live surface.',
];
