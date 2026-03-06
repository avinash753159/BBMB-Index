import { motion } from 'framer-motion';

export default function Chip({ selected, onClick, children, className = '', ...props }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-2.5 rounded-full border px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 focus-visible:ring-offset-2 ${
        selected
          ? 'border-transparent bg-gradient-to-br from-stone-900 to-stone-800 text-amber-50'
          : 'border-line bg-white/70 text-ink hover:border-line-strong'
      } ${className}`}
      whileHover={{ y: -1, boxShadow: '0 14px 28px rgba(61,44,23,0.1)' }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
