import { memo } from 'react';
import { motion } from 'framer-motion';

function BrandMark() {
  return (
    <motion.div
      className="w-[138px] flex-none rounded-[28px] bg-amber-50/92 p-1.5 max-md:w-[108px]"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.78), 0 16px 40px rgba(78,55,29,0.06)' }}
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity }}
    >
      <svg viewBox="0 0 190 110" role="presentation" className="block h-auto w-full">
        <defs>
          <linearGradient id="cupTea" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d89a5f" />
            <stop offset="100%" stopColor="#9c5d2e" />
          </linearGradient>
          <linearGradient id="breadTone" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0c46d" />
            <stop offset="100%" stopColor="#cc8f42" />
          </linearGradient>
        </defs>
        <ellipse cx="94" cy="55" rx="88" ry="44" fill="#fff7eb" stroke="#d5c2aa" strokeWidth="2" />
        <path d="M37 16h9l10 22H45z" fill="#28211a" />
        <path d="M21 35h50l-7 43c-1.4 9.4-9.5 16.3-19 16.3h-0.3c-9.5 0-17.6-6.9-19-16.3z" fill="#f5ead9" stroke="#5a4937" strokeWidth="3.4" />
        <path d="M24 46h44l-5 29.5c-0.9 6.5-6.5 11.3-13.1 11.3H42c-6.6 0-12.1-4.8-13.1-11.3z" fill="url(#cupTea)" />
        <circle cx="36" cy="75" r="4.4" fill="#2c211b" />
        <circle cx="48" cy="81" r="4.4" fill="#2c211b" />
        <circle cx="59" cy="74" r="4.4" fill="#2c211b" />
        <circle cx="44" cy="67" r="3.8" fill="#2c211b" />
        <circle cx="54" cy="66" r="3.8" fill="#2c211b" />
        <path d="M15 35h62" stroke="#5a4937" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M95 50c0-18 17-31 45-31 31 0 47 13 47 30 0 16-17 28-45 28-31 0-47-10-47-27z" fill="url(#breadTone)" stroke="#7d5a34" strokeWidth="3.4" />
        <path d="M102 55c4 12 18 18 40 18 20 0 32-5 39-15-7 1.9-14.6 2.8-23 2.8h-34.8c-8 0-15.1-1.9-21.2-5.8z" fill="#f7d898" />
        <path d="M110 46c8 6.2 20 10 34 10 14 0 30-3.2 39-10" stroke="#fff9ef" strokeWidth="5.6" strokeLinecap="round" />
        <path d="M116 45c0 0 5-8 10-8 5 0 8 6 12 6s7-7 12-7c5 0 7 7 13 7s8-6 13-6" stroke="#3d8a58" strokeWidth="4.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M121 51c7 0 12-7 18-7 5 0 10 6 15 6 6 0 9-5 14-5 5 0 11 5 17 5" stroke="#d45a39" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M124 39c8-6 19-9 35-9" stroke="#f3c355" strokeWidth="4" strokeLinecap="round" />
        <path d="M112 31l3 7M128 26l3 8M147 24l2.6 8M164 28l2.6 8" stroke="#97673a" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}

export default memo(BrandMark);
