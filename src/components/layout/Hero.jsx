import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import BrandMark from './BrandMark';
import Eyebrow from '../ui/Eyebrow';
import { formatDate } from '../../lib/formatters';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
};

export default function Hero({ metadata, selectedCount }) {
  return (
    <motion.header
      className="grid grid-cols-[minmax(0,1.35fr)_minmax(280px,0.78fr)] items-stretch gap-5 max-lg:grid-cols-1"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp}>
        <GlassCard className="h-full overflow-hidden p-6 max-md:p-5">
          <div className="flex items-center gap-4 max-md:items-start">
            <BrandMark />
            <div className="min-w-0">
              <Eyebrow>Five-year comparison lab</Eyebrow>
              <h1 className="mt-1.5 text-4xl font-semibold leading-none tracking-tighter text-balance md:text-6xl">
                Boba Bonh Mi Bros
              </h1>
            </div>
          </div>
          <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-muted text-pretty">
            Compare AVI, the Pabrai composite, each PIF fund, and SPY on one fixed five-year canvas,
            then swap the detail panel without rebuilding the chart.
          </p>
        </GlassCard>
      </motion.div>

      <motion.div className="grid gap-3.5" variants={stagger}>
        <motion.div variants={fadeUp}>
          <HeroPanel
            label="Window"
            value={`${formatDate(metadata.windowStart)} to ${formatDate(metadata.windowEnd)}`}
            note="Fixed comparison span"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <HeroPanel
            label="Compare stack"
            value={`${selectedCount} active line${selectedCount === 1 ? '' : 's'}`}
            note={`${metadata.benchmarkSymbol} \u2014 ${metadata.benchmarkName}`}
          />
        </motion.div>
      </motion.div>
    </motion.header>
  );
}

function HeroPanel({ label, value, note }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-amber-50/88 p-4 shadow-card backdrop-blur-xl">
      <Eyebrow>{label}</Eyebrow>
      <strong className="mt-2.5 block text-lg font-semibold leading-tight lg:text-xl">{value}</strong>
      <span className="mt-2.5 block leading-snug text-muted">{note}</span>
    </div>
  );
}
