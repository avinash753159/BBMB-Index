import BrandMark from './BrandMark';

export default function Hero() {
  return (
    <header className="flex items-center gap-4 py-2">
      <BrandMark />
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">
          Boba Banh Mi Bros
        </h1>
        <p className="text-sm text-muted">
          Invert the bros
        </p>
      </div>
    </header>
  );
}
