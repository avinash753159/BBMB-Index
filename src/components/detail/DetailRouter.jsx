import { motion, AnimatePresence } from 'framer-motion';
import AviDetail from './AviDetail';
import PabraiDetail from './PabraiDetail';
import FundDetail from './FundDetail';
import PendingDetail from './PendingDetail';

export default function DetailRouter({ view, model, onSetSeries }) {
  if (!view) return null;

  const inner = (() => {
    switch (view.kind) {
      case 'portfolio':
        return <AviDetail view={view} model={model} onSetSeries={onSetSeries} />;
      case 'composite':
        return <PabraiDetail view={view} model={model} onSetSeries={onSetSeries} />;
      case 'fund':
        return <FundDetail view={view} model={model} onSetSeries={onSetSeries} />;
      default:
        return <PendingDetail view={view} />;
    }
  })();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        {inner}
      </motion.div>
    </AnimatePresence>
  );
}
