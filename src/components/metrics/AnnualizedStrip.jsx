import AnnualizedCard from './AnnualizedCard';

export default function AnnualizedStrip({ selectedSeries }) {
  return (
    <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
      {selectedSeries.map((series) => (
        <AnnualizedCard key={series.id} series={series} />
      ))}
    </div>
  );
}
