import Eyebrow from '../ui/Eyebrow';

export default function MetricTile({ label, value }) {
  return (
    <div className="rounded-[18px] border border-line/60 bg-white/90 p-4">
      <Eyebrow>{label}</Eyebrow>
      <strong className="mt-2 block font-mono text-xl font-semibold leading-tight">{value}</strong>
    </div>
  );
}
