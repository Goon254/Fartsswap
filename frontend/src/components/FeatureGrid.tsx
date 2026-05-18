'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { SectionLabel } from '@/components/SectionLabel';
import { fadeUp, staggerParent, transitionBrand } from '@/lib/motion';
import { FEATURE_PANELS } from '@/lib/data';

/**
 * Three-panel feature grid: ANALYZE · CLASSIFY · SHARE.
 *
 * Each panel is its own bordered surface with a roman numeral, a brass micro
 * label, an editorial headline, body, and a monospace technical spec footer.
 * On hover the panel lifts and a brass top-rule appears — small details that
 * make the page feel "instrument-grade" rather than "feature list".
 */
export const FeatureGrid: FC = () => (
  <section className="relative">
    <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[18rem_1fr] lg:gap-16">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={transitionBrand}
          className="flex flex-col gap-5"
        >
          <SectionLabel index="II">OPERATIONS MANUAL</SectionLabel>
          <h2 className="font-display text-3xl leading-tight tracking-tight text-[var(--text-strong)] sm:text-4xl">
            A small lab. A serious refusal to be serious.
          </h2>
          <p className="max-w-[36ch] text-sm leading-relaxed text-[var(--text-default)]">
            Every dossier moves through three stations. The procedure is
            humourless on purpose; the output is humourless on accident.
          </p>
        </motion.div>

        <motion.ol
          variants={staggerParent}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--border-subtle)] md:grid-cols-3"
        >
          {FEATURE_PANELS.map((panel) => (
            <motion.li
              key={panel.label}
              variants={fadeUp}
              transition={transitionBrand}
              whileHover={{ y: -3 }}
              className="group/panel relative flex flex-col gap-6 bg-[var(--bg-panel)] p-7"
            >
              {/* brass top-rule on hover */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px scale-x-0 origin-left bg-[var(--accent-brass)] transition-transform duration-500 group-hover/panel:scale-x-100"
              />
              <div className="flex items-baseline justify-between">
                <span className="font-display text-4xl leading-none tracking-tight text-[var(--accent-brass)] opacity-90">
                  {panel.numeral}
                </span>
                <span className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
                  {panel.label}
                </span>
              </div>

              <h3 className="font-display text-2xl leading-tight tracking-tight text-[var(--text-strong)]">
                {panel.title}
              </h3>

              <p className="text-sm leading-relaxed text-[var(--text-default)]">{panel.body}</p>

              <div className="mt-auto border-t border-[var(--border-subtle)] pt-4">
                <div className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
                  SPEC
                </div>
                <div className="mt-1 font-mono text-[0.72rem] tracking-wide-2 text-[var(--text-default)]">
                  {panel.spec}
                </div>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </div>
  </section>
);
