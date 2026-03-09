import { memo } from 'react';

function BrandMark() {
  return (
    <div className="flex flex-none items-center gap-0.5 max-md:scale-85">
      {/* Boba tea — bobs up and down */}
      <svg viewBox="0 0 52 72" className="h-14 w-auto animate-bob" role="presentation">
        <defs>
          <linearGradient id="boba-tea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0a030" />
            <stop offset="100%" stopColor="#d07818" />
          </linearGradient>
          <clipPath id="cup-clip">
            <path d="M10 24h32l-4 40c-.6 3.5-3.5 6-7 6H21c-3.5 0-6.4-2.5-7-6z" />
          </clipPath>
        </defs>

        {/* Straw */}
        <rect x="19" y="0" width="3.5" height="28" rx="1.75" fill="#f0c030" />
        <path d="M20.75 4 Q16 10 19 16" stroke="#f0c030" strokeWidth="3.5" fill="none" strokeLinecap="round" />

        {/* Cup body */}
        <path d="M10 24h32l-4 40c-.6 3.5-3.5 6-7 6H21c-3.5 0-6.4-2.5-7-6z"
          fill="rgba(245,240,232,0.55)" stroke="#bfb8a0" strokeWidth="1.2" />

        {/* Dome lid */}
        <path d="M9 24 Q26 17.5 43 24" fill="rgba(235,230,220,0.45)" stroke="#bfb8a0" strokeWidth="1.2" />
        <line x1="9" y1="24" x2="43" y2="24" stroke="#bfb8a0" strokeWidth="1.2" />

        {/* Tea fill */}
        <g clipPath="url(#cup-clip)">
          <rect x="10" y="30" width="32" height="40" fill="url(#boba-tea)" />
          <rect x="10" y="28" width="32" height="4" fill="#f8e8c8" opacity="0.9" />
          <circle cx="19" cy="56" r="3" fill="#2a1608" />
          <circle cx="26" cy="54" r="3" fill="#2a1608" />
          <circle cx="33" cy="56" r="3" fill="#2a1608" />
          <circle cx="22" cy="60" r="3" fill="#2a1608" />
          <circle cx="29" cy="61" r="3" fill="#2a1608" />
          <circle cx="18" cy="55" r="0.9" fill="rgba(255,255,255,0.4)" />
          <circle cx="25" cy="53" r="0.9" fill="rgba(255,255,255,0.4)" />
        </g>
      </svg>

      {/* Banh mi — 45 degree tilt, bobs with offset */}
      <svg viewBox="0 0 72 40" className="h-11 w-auto animate-bob-delayed" role="presentation">
        <defs>
          <linearGradient id="bm-crust" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5d880" />
            <stop offset="100%" stopColor="#d4a028" />
          </linearGradient>
          <linearGradient id="bm-crumb" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f8ecd0" />
            <stop offset="100%" stopColor="#e8d4a0" />
          </linearGradient>
        </defs>

        {/* Top baguette dome */}
        <path d="M6 22 C8 4, 24 0, 36 0 C48 0, 64 4, 66 22 Z"
          fill="url(#bm-crust)" stroke="#c09018" strokeWidth="0.8" />

        {/* Score lines */}
        <path d="M22 5 L24 16" stroke="#c8a840" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        <path d="M34 3 L35.5 16" stroke="#c8a840" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        <path d="M46 5 L48 16" stroke="#c8a840" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />

        {/* Bread shine */}
        <path d="M26 5 c6-1.2 12-1.2 18 0" stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Filling strip */}
        <rect x="10" y="20" width="52" height="5" rx="1" fill="url(#bm-crumb)" />

        {/* Filling accents */}
        <line x1="12" y1="21.5" x2="60" y2="21.5" stroke="#e87530" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="14" y1="23" x2="58" y2="23" stroke="#78b050" strokeWidth="1" strokeLinecap="round" />
        <circle cx="22" cy="22" r="1.2" fill="#3d8828" />
        <circle cx="36" cy="22.5" r="1.2" fill="#3d8828" />
        <circle cx="50" cy="22" r="1.2" fill="#3d8828" />

        {/* Bottom bread */}
        <path d="M8 25 C10 34, 26 36, 36 36 C46 36, 62 34, 64 25 Z"
          fill="url(#bm-crumb)" stroke="#c8a848" strokeWidth="0.6" />
      </svg>
    </div>
  );
}

export default memo(BrandMark);
