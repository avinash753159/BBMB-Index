import { motion } from 'framer-motion';

export default function ActionButton({ onClick, children }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3.5 py-2.5 text-sm text-ink transition-colors hover:bg-accent/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 focus-visible:ring-offset-2"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
}
