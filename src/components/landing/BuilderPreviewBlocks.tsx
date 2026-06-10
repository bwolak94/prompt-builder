/**
 * Animated builder block preview for the landing page.
 * Blocks appear sequentially (stagger 0.2s) when scrolled into view.
 */
import { motion, useReducedMotion } from 'framer-motion';

const blocks = [
  {
    slug: 'role',
    label: 'Rola',
    color: 'text-violet-300',
    border: 'border-violet-600/30',
    bg: 'bg-violet-600/10',
    dot: 'bg-violet-400',
    content: 'Jesteś doświadczonym senior software engineerem specjalizującym się w TypeScript i architekturze mikroserwisów.',
  },
  {
    slug: 'context',
    label: 'Kontekst',
    color: 'text-blue-300',
    border: 'border-blue-600/30',
    bg: 'bg-blue-600/10',
    dot: 'bg-blue-400',
    content: 'Pracuję nad SaaS aplikacją do zarządzania zadaniami z 50k użytkownikami. Stack: Node.js, PostgreSQL, Redis.',
  },
  {
    slug: 'task',
    label: 'Zadanie',
    color: 'text-emerald-300',
    border: 'border-emerald-600/30',
    bg: 'bg-emerald-600/10',
    dot: 'bg-emerald-400',
    content: 'Zaprojektuj system kolejkowania zadań który obsługuje 10k operacji/s z gwarancją dostarczenia at-least-once.',
  },
];

export default function BuilderPreviewBlocks() {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.2 } },
  };

  const blockVariants = {
    hidden: { opacity: 0, x: prefersReducedMotion ? 0 : -12 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  return (
    <motion.div
      className="space-y-3"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
    >
      {blocks.map(({ slug, label, color, border, bg, dot, content }) => (
        <motion.div
          key={slug}
          variants={blockVariants}
          className={`rounded-lg border ${border} ${bg} overflow-hidden`}
        >
          {/* Block header */}
          <div className={`flex items-center gap-2 border-b ${border} px-3 py-2`}>
            <span className={`h-2 w-2 rounded-full ${dot}`}></span>
            <span className={`text-xs font-semibold ${color}`}>{label}</span>
          </div>
          {/* Block content */}
          <p className="px-3 py-2.5 text-xs leading-relaxed text-text-secondary">{content}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
