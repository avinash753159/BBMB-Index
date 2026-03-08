import { motion } from 'framer-motion';
import BrandMark from './BrandMark';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
};

export default function Hero() {
  return (
    <motion.header
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="flex items-center gap-4 py-2"
    >
      <BrandMark />
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">
          Boba Bonh Mi Bros
        </h1>
        <p className="text-sm text-muted">
          Invert the bros
        </p>
      </div>
    </motion.header>
  );
}
