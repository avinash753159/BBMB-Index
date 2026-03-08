export default function GlassCard({ children, className = '', as: Tag = 'section', ...props }) {
  return (
    <Tag
      className={`relative rounded-[var(--radius-xl)] border border-line bg-surface shadow-card ${className}`}
      {...props}
    >
      <div className="relative">{children}</div>
    </Tag>
  );
}
