const TICKER_STYLES = {
  BABA: { bg: '#ff6a00', text: '#fff', label: 'BABA' },
  SOC: { bg: '#1a73e8', text: '#fff', label: 'SOC' },
  OXY: { bg: '#c62828', text: '#fff', label: 'OXY' },
  CHGG: { bg: '#f57c00', text: '#fff', label: 'CG' },
  DIDIY: { bg: '#00897b', text: '#fff', label: 'DD' },
  'BRK.B': { bg: '#37474f', text: '#fff', label: 'BRK' },
  MU: { bg: '#1565c0', text: '#fff', label: 'MU' },
  PLTR: { bg: '#1a1a2e', text: '#fff', label: 'PLT' },
  FOUR: { bg: '#6a1b9a', text: '#fff', label: '4' },
  AAPL: { bg: '#555555', text: '#fff', label: 'APL' },
  GOOGL: { bg: '#2b6cc4', text: '#fff', label: 'GOG' },
  GOOG: { bg: '#2b6cc4', text: '#fff', label: 'GOG' },
  BAC: { bg: '#012169', text: '#fff', label: 'BAC' },
  PDD: { bg: '#e02e24', text: '#fff', label: 'PDD' },
  EWBC: { bg: '#b71c1c', text: '#fff', label: 'EWB' },
  CROX: { bg: '#007a33', text: '#fff', label: 'CRX' },
  AXP: { bg: '#006fcf', text: '#fff', label: 'AXP' },
  KO: { bg: '#c50007', text: '#fff', label: 'KO' },
  CVX: { bg: '#0066b2', text: '#fff', label: 'CVX' },
  MCO: { bg: '#002d72', text: '#fff', label: 'MCO' },
  CB: { bg: '#003b5c', text: '#fff', label: 'CB' },
  KHC: { bg: '#e21a23', text: '#fff', label: 'KHC' },
  DVA: { bg: '#00843d', text: '#fff', label: 'DVA' },
  KR: { bg: '#0033a0', text: '#fff', label: 'KR' },
  V: { bg: '#1a1f71', text: '#fff', label: 'V' },
  'BRK.A': { bg: '#37474f', text: '#fff', label: 'BRK' },
  ALLY: { bg: '#6c1d8b', text: '#fff', label: 'ALY' },
  WGO: { bg: '#003d7a', text: '#fff', label: 'WGO' },
  SWBI: { bg: '#b71c1c', text: '#fff', label: 'SW' },
  SGOV: { bg: '#546e7a', text: '#fff', label: 'SGV' },
  PYPL: { bg: '#003087', text: '#fff', label: 'PPL' },
  FISV: { bg: '#ff6f00', text: '#fff', label: 'FSV' },
  WFC: { bg: '#d71e28', text: '#fff', label: 'WFC' },
  PG: { bg: '#003da5', text: '#fff', label: 'PG' },
  WMT: { bg: '#0071ce', text: '#fff', label: 'WMT' },
  JNJ: { bg: '#d51900', text: '#fff', label: 'JNJ' },
  COP: { bg: '#c41230', text: '#fff', label: 'COP' },
  IBM: { bg: '#0530ad', text: '#fff', label: 'IBM' },
  USB: { bg: '#0d2d6c', text: '#fff', label: 'USB' },
  BK: { bg: '#231f20', text: '#fff', label: 'BK' },
  VZ: { bg: '#cd040b', text: '#fff', label: 'VZ' },
  GM: { bg: '#0170ce', text: '#fff', label: 'GM' },
  CHTR: { bg: '#0078d4', text: '#fff', label: 'CHT' },
  VRSN: { bg: '#003b73', text: '#fff', label: 'VRS' },
  JPM: { bg: '#005eb8', text: '#fff', label: 'JPM' },
  HPQ: { bg: '#0096d6', text: '#fff', label: 'HPQ' },
  TSM: { bg: '#c8102e', text: '#fff', label: 'TSM' },
  BIDU: { bg: '#2529d8', text: '#fff', label: 'BDU' },
  META: { bg: '#0668e1', text: '#fff', label: 'MTA' },
  ATVI: { bg: '#00aeff', text: '#000', label: 'ATV' },
};

export default function TickerLogo({ ticker }) {
  const style = TICKER_STYLES[ticker];
  const bg = style?.bg ?? '#64748b';
  const text = style?.text ?? '#fff';
  const label = style?.label ?? ticker?.slice(0, 2) ?? '?';

  return (
    <span
      className="flex h-6 w-6 flex-none items-center justify-center rounded-md text-[0.5625rem] font-bold leading-none"
      style={{ backgroundColor: bg, color: text }}
      aria-hidden="true"
    >
      {label.slice(0, 3)}
    </span>
  );
}
