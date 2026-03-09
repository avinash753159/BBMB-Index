import { lazy, Suspense } from 'react';

const BrandMark = lazy(() => import('./BrandMark'));

export default function Hero() {
  return (
    <header className="flex items-center gap-4 py-2">
      <Suspense fallback={<div className="h-14 w-20 flex-none" />}>
        <BrandMark />
      </Suspense>
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
