import { getSeriesAppearance } from '../../lib/constants';

const AVATAR_DATA = {
  AVI: ['#2d6a4f', '#b7e4c7', 'A'],
  PABRAI: ['#c1292e', '#fdd', 'P'],
  PIF2: ['#8b7355', '#ede0d0', 'P2'],
  PIF3: ['#6b7c5f', '#dde5d8', 'P3'],
  PIF4: ['#7a6b5d', '#e3ddd7', 'P4'],
  JOEY: ['#7c5cbf', '#ede7f6', 'J'],
  PRAB: ['#b5543a', '#fbe9e7', 'PR'],
  WAGN: ['#3a7db5', '#e3f2fd', 'W'],
  LI_LU: ['#1a5276', '#d4e6f1', 'LL'],
  BUFFETT: ['#7d3c98', '#e8daef', 'WB'],
  NORBERT: ['#2e7d32', '#c8e6c9', 'NL'],
};

function PersonAvatar({ bg, fg, initials }) {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <circle cx="20" cy="20" r="20" fill={bg} />
      <circle cx="20" cy="15" r="7" fill={fg} />
      <ellipse cx="20" cy="32" rx="11" ry="8" fill={fg} />
      <text x="20" y="18" textAnchor="middle" fontSize={initials.length > 1 ? 8 : 9} fontWeight="700" fill={bg}>{initials}</text>
    </svg>
  );
}

function SpyAvatar() {
  return (
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
  );
}

export default function SeriesAvatar({ id, size = 'md' }) {
  const sizeClass = {
    xs: 'h-4 w-4',
    sm: 'h-5 w-5',
    md: 'h-7 w-7',
    lg: 'h-9 w-9',
  }[size] ?? 'h-7 w-7';

  const data = AVATAR_DATA[id];
  const isSpy = id === 'SPY';

  if (!data && !isSpy) {
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
      {isSpy ? <SpyAvatar /> : <PersonAvatar bg={data[0]} fg={data[1]} initials={data[2]} />}
    </span>
  );
}
