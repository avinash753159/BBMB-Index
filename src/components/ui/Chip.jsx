export default function Chip({ selected, onClick, children, className = '', ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all hover:-translate-y-px active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha/20 focus-visible:ring-offset-2 ${
        selected
          ? 'border-ink/12 bg-ink text-white shadow-sm'
          : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
