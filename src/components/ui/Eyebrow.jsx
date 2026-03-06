export default function Eyebrow({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted ${className}`}>
      {children}
    </span>
  );
}
