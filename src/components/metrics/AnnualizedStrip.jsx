import AnnualizedCard from './AnnualizedCard';

export default function AnnualizedStrip({ selectedSeries }) {
  return (
    <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(200px,1fr))] max-sm:grid-cols-1 max-sm:gap-2">
      {selectedSeries.map((series) => (
        <AnnualizedCard key={series.id} series={series} />
      ))}
    </div>
  );
}
