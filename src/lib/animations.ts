/**
 * Framer Motion animation presets.
 *
 * Rules (from 05-design-system.md):
 *  - Only transform + opacity (GPU-accelerated, no layout thrashing)
 *  - Duration: 150–350ms
 *  - Easing: ease-out for entering, ease-in for leaving
 *  - prefers-reduced-motion: Framer Motion respects this automatically
 *    via useReducedMotion() hook
 */

import type { Variants } from 'framer-motion';

// ── Page / section entry ────────────────────────────────────────

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.2, ease: 'easeIn' } },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
};

// ── Stagger containers ──────────────────────────────────────────

/** Parent container — staggers children with 0.08s delay between each */
export const staggerContainer: Variants = {
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

/** Parent container with faster stagger for tighter grids */
export const staggerContainerFast: Variants = {
  animate: {
    transition: { staggerChildren: 0.05 },
  },
};

/** Child item for stagger containers */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ── Builder block animations ────────────────────────────────────

/** Used with AnimatePresence on PromptBlock mount/unmount */
export const blockEnter: Variants = {
  initial: { opacity: 0, scale: 0.97, y: 8 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -8,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

// ── Scroll-triggered (landing page) ────────────────────────────

/** For whileInView with once: true — section cards on landing page */
export const scrollReveal: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// ── Dialog / modal ──────────────────────────────────────────────

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

// ── Overlay / backdrop ──────────────────────────────────────────

export const backdropFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// ── Hero headline (landing page) ────────────────────────────────

/** Each word/line appears with offset */
export const heroText: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export const heroContainer: Variants = {
  animate: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};
