import GlassCard from '../ui/GlassCard';
import Eyebrow from '../ui/Eyebrow';
import Chip from '../ui/Chip';

export default function FocusTabs({ views, activeView, onViewChange }) {
  return (
    <GlassCard className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)] items-center gap-4 p-5 max-lg:grid-cols-1">
      <div>
        <Eyebrow>Focus view</Eyebrow>
        <h2 className="mt-1.5 text-lg font-semibold leading-tight tracking-tight lg:text-xl">
          Change the detail panel without losing your compare stack
        </h2>
      </div>
      <div className="flex flex-wrap justify-end gap-2.5 max-lg:justify-start" role="tablist" aria-label="Dashboard views">
        {views.map((view) => (
          <Chip
            key={view.id}
            selected={activeView === view.id}
            onClick={() => onViewChange(view.id)}
            role="tab"
            aria-selected={activeView === view.id}
          >
            {view.label}
          </Chip>
        ))}
      </div>
    </GlassCard>
  );
}
