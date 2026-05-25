'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { FC } from 'react';

interface AnimatedVoteCountProps {
  count: number;
  className?: string;
  lethal?: boolean;
}

export const AnimatedVoteCount: FC<AnimatedVoteCountProps> = ({
  count,
  className = '',
  lethal = false,
}) => {
  const reduceMotion = useReducedMotion();
  const formatted = count.toLocaleString('en-US');

  if (reduceMotion) {
    return <span className={className}>{formatted}</span>;
  }

  return (
    <motion.span
      key={count}
      className={className}
      initial={{ opacity: 0, y: 8, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: lethal ? [1, 1.12, 1] : 1 }}
      transition={{
        duration: lethal ? 0.5 : 0.35,
        ease: [0.22, 0.61, 0.36, 1],
      }}
    >
      {formatted}
    </motion.span>
  );
};
