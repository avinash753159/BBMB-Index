export default function ActionButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-matcha/20 bg-matcha-muted px-3 py-1.5 text-sm font-medium text-matcha transition-all hover:-translate-y-px hover:bg-matcha/12 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha/20 focus-visible:ring-offset-2"
    >
      {children}
    </button>
  );
}
