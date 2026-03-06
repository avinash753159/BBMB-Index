const kindStyles = {
  portfolio: 'text-series-avi',
  composite: 'text-series-pabrai',
  fund: 'text-series-pif2',
  benchmark: 'text-series-spy',
  pending: 'text-muted',
};

export default function Pill({ kind, children }) {
  return (
    <span className={`inline-flex items-center rounded-full border border-line bg-white/70 px-2 py-1 text-[0.73rem] font-semibold tracking-wide ${kindStyles[kind] ?? kindStyles.pending}`}>
      {children}
    </span>
  );
}
