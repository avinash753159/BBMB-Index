export default function Eyebrow({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted ${className}`}>
      {children}
    </span>
  );
}
