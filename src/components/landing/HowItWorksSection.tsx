import { motion, useReducedMotion } from 'framer-motion';
import { Layout, PenLine, Sparkles } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Layout,
    title: 'Wybierz sekcje',
    description:
      'Dodaj bloki z palety — Rola, Kontekst, Zadanie, Format i więcej. Każda sekcja ma swój kolor dla szybkiej identyfikacji.',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
    border: 'border-brand-500/25',
  },
  {
    number: '02',
    icon: PenLine,
    title: 'Wypełnij treść',
    description:
      'Pisz i edytuj zawartość każdej sekcji. Używaj zmiennych {{jak_ta}}, które możesz wypełniać dynamicznie.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/25',
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'Oceń z AI',
    description:
      'Kliknij "Oceń prompt" — AI przeanalizuje klarowność, specyficzność, strukturę i da konkretne sugestie poprawy.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
  },
];

export default function HowItWorksSection() {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.15 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
  };

  return (
    <section className="px-4 py-20 sm:py-28" aria-labelledby="how-it-works-heading">
      <div className="mx-auto max-w-5xl">
        {/* Heading */}
        <div className="mb-14 text-center">
          <h2
            id="how-it-works-heading"
            className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl"
          >
            Jak to działa?
          </h2>
          <p className="mt-3 text-text-secondary">
            Trzy kroki od pustego ekranu do dopracowanego promptu.
          </p>
        </div>

        {/* Steps */}
        <motion.div
          className="grid gap-6 md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {steps.map(({ number, icon: Icon, title, description, color, bg, border }) => (
            <motion.div
              key={number}
              variants={itemVariants}
              className={`relative rounded-xl border ${border} ${bg} p-6`}
            >
              {/* Step number */}
              <span className="text-5xl font-bold leading-none text-text-disabled select-none">
                {number}
              </span>

              {/* Icon */}
              <div className={`mt-4 inline-flex rounded-lg border ${border} ${bg} p-2.5`}>
                <Icon size={20} className={color} aria-hidden="true" />
              </div>

              <h3 className="mt-4 font-semibold text-text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
