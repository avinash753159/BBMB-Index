import { AnimatePresence } from 'framer-motion';
import AnnualizedCard from './AnnualizedCard';

export default function AnnualizedStrip({ selectedSeries }) {
  return (
    <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
      <AnimatePresence mode="popLayout">
        {selectedSeries.map((series) => (
          <AnnualizedCard key={series.id} series={series} />
        ))}
      </AnimatePresence>
    </div>
  );
}
