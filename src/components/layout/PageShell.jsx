export default function PageShell({ children }) {
  return (
    <div className="relative mx-auto w-[min(1200px,calc(100vw-48px))] space-y-6 py-8 pb-16 max-md:w-[min(100vw-24px,1200px)] max-md:pt-6">
      {children}
    </div>
  );
}
