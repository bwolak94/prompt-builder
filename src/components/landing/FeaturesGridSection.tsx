import { motion, useReducedMotion } from 'framer-motion';
import {
  LayoutTemplate,
  BrainCircuit,
  BookOpen,
  Braces,
  Globe,
  GitFork,
} from 'lucide-react';

const features = [
  {
    icon: LayoutTemplate,
    title: 'Wizualny Builder',
    description:
      'Przeciągaj i upuszczaj bloki sekcji. Buduj strukturę promptu wizualnie bez ręcznego formatowania.',
    color: 'text-brand-400',
    bg: 'bg-brand-500/8',
    border: 'border-brand-500/20',
    glow: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]',
  },
  {
    icon: BrainCircuit,
    title: 'AI Scoring',
    description:
      'Otrzymaj szczegółową ocenę 5 wymiarów: klarowność, specyficzność, struktura, ton, kompletność.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/8',
    border: 'border-emerald-500/20',
    glow: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.12)]',
  },
  {
    icon: BookOpen,
    title: 'Biblioteka szablonów',
    description:
      '20+ gotowych szablonów dla kodowania, pisania, analizy i role-play — gotowe do użycia i edycji.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/8',
    border: 'border-blue-500/20',
    glow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.12)]',
  },
  {
    icon: Braces,
    title: 'Zmienne',
    description:
      'Definiuj {{zmienne}} w promptach. Wypełniaj je dynamicznie dla każdego użycia bez edycji szablonu.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/8',
    border: 'border-amber-500/20',
    glow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.12)]',
  },
  {
    icon: Globe,
    title: 'Udostępnianie',
    description:
      'Opublikuj prompt ze stałym linkiem. Reszta społeczności może go przeglądać, oceniać i forkować.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/8',
    border: 'border-cyan-500/20',
    glow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.12)]',
  },
  {
    icon: GitFork,
    title: 'Fork & Dostosuj',
    description:
      'Zforkuj dowolny publiczny prompt jednym kliknięciem. Modyfikuj go pod siebie — oryginał pozostaje nienaruszony.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/8',
    border: 'border-purple-500/20',
    glow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.12)]',
  },
];

export default function FeaturesGridSection() {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.1 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
  };

  return (
    <section className="px-4 py-20 sm:py-28" aria-labelledby="features-heading">
      <div className="mx-auto max-w-5xl">
        {/* Heading */}
        <div className="mb-14 text-center">
          <h2
            id="features-heading"
            className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl"
          >
            Wszystko czego potrzebujesz
          </h2>
          <p className="mt-3 text-text-secondary">
            Narzędzia które przekształcają chaotyczne eksperymenty w systematyczną inżynierię promptów.
          </p>
        </div>

        {/* 2×3 grid */}
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {features.map(({ icon: Icon, title, description, color, bg, border, glow }) => (
            <motion.div
              key={title}
              variants={cardVariants}
              className={`group rounded-xl border ${border} ${bg} p-5 transition-shadow duration-300 ${glow}`}
            >
              <div className={`inline-flex rounded-lg border ${border} ${bg} p-2`}>
                <Icon size={18} className={color} aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-semibold text-text-primary">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
