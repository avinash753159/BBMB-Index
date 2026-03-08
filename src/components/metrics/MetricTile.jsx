import Eyebrow from '../ui/Eyebrow';

export default function MetricTile({ label, value }) {
  return (
    <div className="rounded-xl border border-line bg-bg/60 p-3.5">
      <Eyebrow>{label}</Eyebrow>
      <strong className="mt-1.5 block font-mono text-lg font-semibold leading-tight">{value}</strong>
    </div>
  );
}
