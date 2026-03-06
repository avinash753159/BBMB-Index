export default function PageShell({ children }) {
  return (
    <div className="relative mx-auto w-[min(1380px,calc(100vw-36px))] space-y-5 py-7 pb-14 max-md:w-[min(100vw-24px,1380px)] max-md:pt-5">
      {children}
    </div>
  );
}
