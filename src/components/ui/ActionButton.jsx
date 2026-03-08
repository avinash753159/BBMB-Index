import { motion } from 'framer-motion';

export default function ActionButton({ onClick, children }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-matcha/20 bg-matcha-muted px-3 py-1.5 text-sm font-medium text-matcha transition-colors hover:bg-matcha/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha/20 focus-visible:ring-offset-2"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
    >
      {children}
    </motion.button>
  );
}
