import { memo } from 'react';

function BrandMark() {
  return (
    <div className="flex flex-none items-center gap-0.5 max-md:scale-85"
    >
      {/* Boba tea */}
      <svg viewBox="0 0 52 72" className="h-14 w-auto" role="presentation">
        <defs>
          <linearGradient id="boba-tea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0a030" />
            <stop offset="100%" stopColor="#d07818" />
          </linearGradient>
          <linearGradient id="boba-cup" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.04)" />
          </linearGradient>
          <clipPath id="cup-clip">
            <path d="M10 24h32l-4 40c-.6 3.5-3.5 6-7 6H21c-3.5 0-6.4-2.5-7-6z" />
          </clipPath>
        </defs>

        {/* Straw */}
        <rect x="19" y="0" width="3.5" height="28" rx="1.75" fill="#f0c030" />
        <path d="M20.75 4 Q16 10 19 16" stroke="#f0c030" strokeWidth="3.5" fill="none" strokeLinecap="round" />

        {/* Cup body — clear plastic */}
        <path d="M10 24h32l-4 40c-.6 3.5-3.5 6-7 6H21c-3.5 0-6.4-2.5-7-6z"
          fill="rgba(245,240,232,0.55)" stroke="#bfb8a0" strokeWidth="1.2" />
        <path d="M10 24h32l-4 40c-.6 3.5-3.5 6-7 6H21c-3.5 0-6.4-2.5-7-6z"
          fill="url(#boba-cup)" />

        {/* Dome lid */}
        <path d="M9 24 Q26 17.5 43 24" fill="rgba(235,230,220,0.45)" stroke="#bfb8a0" strokeWidth="1.2" />
        <line x1="9" y1="24" x2="43" y2="24" stroke="#bfb8a0" strokeWidth="1.2" />

        {/* Tea fill (clipped to cup) */}
        <g clipPath="url(#cup-clip)">
          {/* Tea liquid */}
          <rect x="10" y="30" width="32" height="40" fill="url(#boba-tea)" />

          {/* Cream layer on top of tea */}
          <rect x="10" y="28" width="32" height="4" fill="#f8e8c8" opacity="0.9" />
          <path d="M14 30c3 1.2 6-.8 9 .4s6-.8 9 .4" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" fill="none" />

          {/* Ice cubes */}
          <rect x="17" y="34" width="6" height="5" rx="1.2" fill="rgba(255,255,255,0.3)" transform="rotate(-8 20 36)" />
          <rect x="28" y="37" width="5.5" height="4.5" rx="1.2" fill="rgba(255,255,255,0.25)" transform="rotate(5 31 39)" />
          <rect x="20" y="42" width="5" height="4" rx="1.2" fill="rgba(255,255,255,0.2)" transform="rotate(-3 22 44)" />

          {/* Boba pearls — packed at bottom */}
          <circle cx="19" cy="56" r="3" fill="#2a1608" />
          <circle cx="26" cy="54" r="3" fill="#2a1608" />
          <circle cx="33" cy="56" r="3" fill="#2a1608" />
          <circle cx="22" cy="60" r="3" fill="#2a1608" />
          <circle cx="29" cy="61" r="3" fill="#2a1608" />
          <circle cx="16" cy="62" r="2.5" fill="#2a1608" />
          <circle cx="35" cy="62" r="2.5" fill="#2a1608" />
          <circle cx="25" cy="65" r="2.5" fill="#2a1608" />

          {/* Pearl shine */}
          <circle cx="18" cy="55" r="0.9" fill="rgba(255,255,255,0.4)" />
          <circle cx="25" cy="53" r="0.9" fill="rgba(255,255,255,0.4)" />
          <circle cx="32" cy="55" r="0.9" fill="rgba(255,255,255,0.35)" />
          <circle cx="21" cy="59" r="0.8" fill="rgba(255,255,255,0.3)" />
        </g>

        {/* Cup shine streak */}
        <path d="M16 30v28" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {/* Banh mi */}
      <svg viewBox="0 0 80 44" className="h-11 w-auto" role="presentation">
        <defs>
          <linearGradient id="bm-top" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5d880" />
            <stop offset="50%" stopColor="#e8b840" />
            <stop offset="100%" stopColor="#d4a028" />
          </linearGradient>
          <linearGradient id="bm-bottom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0deb8" />
            <stop offset="100%" stopColor="#e0c888" />
          </linearGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="40" cy="42" rx="30" ry="2" fill="rgba(0,0,0,0.06)" />

        {/* Bottom bread — boat shape */}
        <path d="M8 24 C10 36, 30 38, 40 38 C50 38, 70 36, 72 24 Z" fill="url(#bm-bottom)" stroke="#c8a848" strokeWidth="0.7" />

        {/* Fillings visible between bread halves */}
        {/* Meat / pâté */}
        <path d="M14 26 Q40 30 66 26" stroke="#a06850" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Carrots — wavy orange */}
        <path d="M14 23 c5-1 8 1 13 0s8 1 13 0 8 1 13 0 8 1 12 0" stroke="#e87530" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M18 24 c4-.8 7 .8 11 0 s7 .8 11 0 7 .8 10 0" stroke="#f09848" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />

        {/* Daikon — white/cream */}
        <path d="M16 21.5 Q40 19 64 21.5" stroke="#f0e8d0" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Cucumber */}
        <ellipse cx="26" cy="20" rx="2.5" ry="1.5" fill="#78b050" stroke="#58903a" strokeWidth="0.4" />
        <ellipse cx="40" cy="19.5" rx="2.5" ry="1.5" fill="#78b050" stroke="#58903a" strokeWidth="0.4" />
        <ellipse cx="54" cy="20" rx="2.5" ry="1.5" fill="#78b050" stroke="#58903a" strokeWidth="0.4" />

        {/* Jalapeño */}
        <circle cx="33" cy="19" r="1.6" fill="#3d8828" stroke="#2a6818" strokeWidth="0.3" />
        <circle cx="47" cy="19" r="1.6" fill="#3d8828" stroke="#2a6818" strokeWidth="0.3" />

        {/* Cilantro — leafy sprigs at each end */}
        <g stroke="#3a8028" fill="none" strokeLinecap="round">
          <path d="M11 20 c-2-3.5-5-4.5-6-2" strokeWidth="1.1" />
          <path d="M10 21 c-3-1.5-6-1.5-6 .5" strokeWidth="0.9" />
          <path d="M12 19 c-1.5-3-4-4.5-5-1.5" strokeWidth="0.8" />
          <path d="M69 20 c2-3.5 5-4.5 6-2" strokeWidth="1.1" />
          <path d="M70 21 c3-1.5 6-1.5 6 .5" strokeWidth="0.9" />
          <path d="M68 19 c1.5-3 4-4.5 5-1.5" strokeWidth="0.8" />
        </g>

        {/* Top bread — golden baguette dome */}
        <path d="M6 24 C8 6, 28 0, 40 0 C52 0, 72 6, 74 24 Z" fill="url(#bm-top)" />
        <path d="M6 24 C8 6, 28 0, 40 0 C52 0, 72 6, 74 24" fill="none" stroke="#c09018" strokeWidth="1" />

        {/* Score lines */}
        <path d="M24 6 L26.5 17" stroke="#c8a840" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
        <path d="M35 3 L37 16" stroke="#c8a840" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
        <path d="M46 3 L48 16" stroke="#c8a840" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
        <path d="M57 6 L59 17" stroke="#c8a840" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />

        {/* Bread shine */}
        <path d="M28 5 c8-1.5 16-1.5 24 0" stroke="rgba(255,255,255,0.35)" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* Flour dusting */}
        <circle cx="31" cy="9" r="1" fill="rgba(255,255,255,0.18)" />
        <circle cx="42" cy="7" r="1.2" fill="rgba(255,255,255,0.14)" />
        <circle cx="52" cy="9" r="0.9" fill="rgba(255,255,255,0.16)" />
      </svg>
    </div>
  );
}

export default memo(BrandMark);
