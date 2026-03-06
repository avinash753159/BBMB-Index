import { AnimatePresence } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import AnnualizedCard from './AnnualizedCard';
import Eyebrow from '../ui/Eyebrow';

export default function AnnualizedStrip({ selectedSeries }) {
  return (
    <GlassCard className="p-6">
      <div>
        <Eyebrow>Annualized return</Eyebrow>
        <h2 className="mt-2 text-xl font-semibold leading-tight tracking-tight lg:text-2xl">
          Only the yearly compounding view stays at the top.
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Total return still shows up inside each card, but the headline number is always annualized return.
        </p>
      </div>
      <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5 max-md:grid-cols-1">
        <AnimatePresence mode="popLayout">
          {selectedSeries.map((series) => (
            <AnnualizedCard key={series.id} series={series} />
          ))}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}
