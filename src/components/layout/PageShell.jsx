export default function PageShell({ children }) {
  return (
    <div className="relative mx-auto w-[min(1200px,calc(100vw-48px))] space-y-6 py-8 pb-16 max-md:w-[min(100vw-16px,1200px)] max-md:space-y-4 max-md:pt-4 max-md:pb-10">
      {children}
    </div>
  );
}
