import Chip from '../ui/Chip';
import Eyebrow from '../ui/Eyebrow';

export default function PresetPanel({ presets, activePresetId, onPresetSelect }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line/60 bg-amber-50/88 p-5">
      <Eyebrow>Presets</Eyebrow>
      <h3 className="mt-2 text-base font-semibold tracking-tight">Quick starting stacks</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Jump straight into common combinations, then fine-tune with the chips on the left.
      </p>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {presets.map((preset) => (
          <Chip
            key={preset.id}
            selected={activePresetId === preset.id}
            onClick={() => onPresetSelect(preset.seriesIds, preset.id)}
          >
            {preset.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
