import { getSeriesAppearance } from '../../lib/constants';

const AVATARS = {
  AVI: () => (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <circle cx="20" cy="20" r="20" fill="#2d6a4f" />
      <circle cx="20" cy="15" r="7" fill="#b7e4c7" />
      <ellipse cx="20" cy="32" rx="11" ry="8" fill="#b7e4c7" />
      <text x="20" y="18" textAnchor="middle" fontSize="9" fontWeight="700" fill="#2d6a4f">A</text>
    </svg>
  ),
  PABRAI: () => (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <circle cx="20" cy="20" r="20" fill="#c1292e" />
      <circle cx="20" cy="15" r="7" fill="#fdd" />
      <ellipse cx="20" cy="32" rx="11" ry="8" fill="#fdd" />
      <text x="20" y="18" textAnchor="middle" fontSize="9" fontWeight="700" fill="#c1292e">P</text>
    </svg>
  ),
  PIF2: () => (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <circle cx="20" cy="20" r="20" fill="#8b7355" />
      <circle cx="20" cy="15" r="7" fill="#ede0d0" />
      <ellipse cx="20" cy="32" rx="11" ry="8" fill="#ede0d0" />
      <text x="20" y="18" textAnchor="middle" fontSize="8" fontWeight="700" fill="#8b7355">P2</text>
    </svg>
  ),
  PIF3: () => (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <circle cx="20" cy="20" r="20" fill="#6b7c5f" />
      <circle cx="20" cy="15" r="7" fill="#dde5d8" />
      <ellipse cx="20" cy="32" rx="11" ry="8" fill="#dde5d8" />
      <text x="20" y="18" textAnchor="middle" fontSize="8" fontWeight="700" fill="#6b7c5f">P3</text>
    </svg>
  ),
  PIF4: () => (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <circle cx="20" cy="20" r="20" fill="#7a6b5d" />
      <circle cx="20" cy="15" r="7" fill="#e3ddd7" />
      <ellipse cx="20" cy="32" rx="11" ry="8" fill="#e3ddd7" />
      <text x="20" y="18" textAnchor="middle" fontSize="8" fontWeight="700" fill="#7a6b5d">P4</text>
    </svg>
  ),
  JOEY: () => (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <circle cx="20" cy="20" r="20" fill="#7c5cbf" />
      <circle cx="20" cy="15" r="7" fill="#ede7f6" />
      <ellipse cx="20" cy="32" rx="11" ry="8" fill="#ede7f6" />
      <text x="20" y="18" textAnchor="middle" fontSize="9" fontWeight="700" fill="#7c5cbf">J</text>
    </svg>
  ),
  PRAB: () => (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <circle cx="20" cy="20" r="20" fill="#b5543a" />
      <circle cx="20" cy="15" r="7" fill="#fbe9e7" />
      <ellipse cx="20" cy="32" rx="11" ry="8" fill="#fbe9e7" />
      <text x="20" y="18" textAnchor="middle" fontSize="8" fontWeight="700" fill="#b5543a">PR</text>
    </svg>
  ),
  WAGN: () => (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <circle cx="20" cy="20" r="20" fill="#3a7db5" />
      <circle cx="20" cy="15" r="7" fill="#e3f2fd" />
      <ellipse cx="20" cy="32" rx="11" ry="8" fill="#e3f2fd" />
      <text x="20" y="18" textAnchor="middle" fontSize="9" fontWeight="700" fill="#3a7db5">W</text>
    </svg>
  ),
  LI_LU: () => (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <circle cx="20" cy="20" r="20" fill="#1a5276" />
      <circle cx="20" cy="15" r="7" fill="#d4e6f1" />
      <ellipse cx="20" cy="32" rx="11" ry="8" fill="#d4e6f1" />
      <text x="20" y="18" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1a5276">LL</text>
    </svg>
  ),
  BUFFETT: () => (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <circle cx="20" cy="20" r="20" fill="#7d3c98" />
      <circle cx="20" cy="15" r="7" fill="#e8daef" />
      <ellipse cx="20" cy="32" rx="11" ry="8" fill="#e8daef" />
      <text x="20" y="18" textAnchor="middle" fontSize="8" fontWeight="700" fill="#7d3c98">WB</text>
    </svg>
  ),
  NORBERT: () => (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <circle cx="20" cy="20" r="20" fill="#2e7d32" />
      <circle cx="20" cy="15" r="7" fill="#c8e6c9" />
      <ellipse cx="20" cy="32" rx="11" ry="8" fill="#c8e6c9" />
      <text x="20" y="18" textAnchor="middle" fontSize="8" fontWeight="700" fill="#2e7d32">NL</text>
    </svg>
  ),
  SPY: () => (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <defs>
        <clipPath id="spy-circle">
          <circle cx="20" cy="20" r="20" />
        </clipPath>
      </defs>
      <g clipPath="url(#spy-circle)">
        {[0, 6, 12, 18, 24, 30, 36].map((y, i) => (
          <rect key={y} x="0" y={y} width="40" height="3.08" fill={i % 2 === 0 ? '#B22234' : '#fff'} />
        ))}
        {[3.08, 9.24, 15.4, 21.56, 27.72, 33.88].map((y, i) => (
          <rect key={y} x="0" y={y} width="40" height="3.08" fill={i % 2 === 0 ? '#fff' : '#B22234'} />
        ))}
        <rect x="0" y="0" width="18" height="18.5" fill="#3C3B6E" />
        {[3, 9, 15].map((x) =>
          [3, 7, 11, 15].map((y) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1" fill="#fff" />
          ))
        )}
        {[6, 12].map((x) =>
          [5, 9, 13].map((y) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1" fill="#fff" />
          ))
        )}
      </g>
      <circle cx="20" cy="20" r="19.5" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
    </svg>
  ),
};

export default function SeriesAvatar({ id, size = 'md' }) {
  const sizeClass = {
    xs: 'h-4 w-4',
    sm: 'h-5 w-5',
    md: 'h-7 w-7',
    lg: 'h-9 w-9',
  }[size] ?? 'h-7 w-7';

  const AvatarSvg = AVATARS[id];

  if (!AvatarSvg) {
    const { rawColor } = getSeriesAppearance(id);
    return (
      <span
        className={`${sizeClass} flex-none rounded-full`}
        style={{ background: rawColor }}
        aria-hidden="true"
      />
    );
  }

  return (
    <span className={`${sizeClass} flex-none overflow-hidden rounded-full`} aria-hidden="true">
      <AvatarSvg />
    </span>
  );
}
