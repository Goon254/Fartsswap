import type { Transition, Variants } from 'framer-motion';

/**
 * Brand motion language.
 *
 * The hero sequence reveals in measured steps — deadpan, almost slow enough
 * to feel like an instrument booting. We use a single shared easing so every
 * element looks like it came out of the same lab.
 */

export const easeBrand: Transition['ease'] = [0.22, 0.61, 0.36, 1];

export const transitionBrand: Transition = {
  duration: 0.7,
  ease: easeBrand,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const fadeSide: Variants = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0 },
};

export const staggerParent: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const floatHover = {
  rest: { y: 0, rotateX: 0, rotateY: 0 },
  hover: { y: -6, rotateX: 1.5, rotateY: -1.5 },
};
