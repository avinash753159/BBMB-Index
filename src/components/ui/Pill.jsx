const kindStyles = {
  portfolio: 'text-matcha bg-matcha-muted',
  composite: 'text-sriracha bg-sriracha-muted',
  fund: 'text-muted bg-bg',
  ticker: 'text-muted bg-bg',
  benchmark: 'text-thai-tea bg-thai-tea-muted',
  pending: 'text-muted bg-bg',
};

export default function Pill({ kind, children }) {
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[0.6875rem] font-medium tracking-wide ${kindStyles[kind] ?? kindStyles.pending}`}>
      {children}
    </span>
  );
}
