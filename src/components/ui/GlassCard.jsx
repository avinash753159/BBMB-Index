export default function GlassCard({ children, className = '', as: Tag = 'section', ...props }) {
  return (
    <Tag
      className={`relative rounded-[var(--radius-xl)] border border-line bg-surface-glass shadow-card backdrop-blur-xl ${className}`}
      {...props}
    >
      <div className="pointer-events-none absolute inset-px rounded-[inherit] border border-white/40" aria-hidden="true" />
      <div className="relative">{children}</div>
    </Tag>
  );
}
