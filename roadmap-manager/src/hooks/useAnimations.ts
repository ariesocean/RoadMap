import { Variants } from 'framer-motion';

export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

export const checkboxVariants: Variants = {
  unchecked: { scale: 1 },
  checked: { scale: 1, transition: { duration: 0.1 } },
};

export const checkmarkVariants: Variants = {
  unchecked: { pathLength: 0, opacity: 0 },
  checked: { pathLength: 1, opacity: 1, transition: { duration: 0.2, ease: 'easeInOut' } },
};

export const pulseVariants: Variants = {
  pulsing: {
    scale: [1, 1.05, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
  },
};

export const expandVariants: Variants = {
  collapsed: { rotate: 0 },
  expanded: { rotate: 180, transition: { duration: 0.2 } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export function useAnimations() {
  return {
    cardVariants,
    checkboxVariants,
    checkmarkVariants,
    pulseVariants,
    expandVariants,
    staggerContainer,
    fadeInUp,
  };
}
