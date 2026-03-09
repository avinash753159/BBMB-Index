import GlassCard from '../ui/GlassCard';
import CompareChip from './CompareChip';
import PresetPanel from './PresetPanel';
import SelectionPanel from './SelectionPanel';
import Eyebrow from '../ui/Eyebrow';

const GROUP_CONFIG = [
  { title: 'Portfolios and composite', ids: ['AVI', 'PABRAI'] },
  { title: 'Single PIF funds', ids: ['PIF2', 'PIF3', 'PIF4'] },
  { title: 'Benchmark', ids: ['SPY'] },
];

export default function CompareLab({
  seriesById,
  selectedSeriesIds,
  selectedSeries,
  presets,
  activePresetId,
  onToggle,
  onPresetSelect,
}) {
  return (
    <GlassCard className="grid grid-cols-[minmax(0,1.3fr)_minmax(290px,0.9fr)] gap-5 p-6 max-lg:grid-cols-1">
      <div className="grid content-start gap-3.5">
        <div>
          <Eyebrow>Compare lines</Eyebrow>
          <h2 className="mt-2 text-xl font-semibold leading-tight tracking-tight lg:text-2xl">
            Pick any stack you want
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            AVI, PABRAI, each PIF fund, and SPY all live on the same five-year chart.
            Toggle combinations without rebuilding the page.
          </p>
        </div>

        <div className="grid gap-4">
          {GROUP_CONFIG.map((group) => {
            const available = group.ids.map((id) => seriesById[id]).filter(Boolean);
            if (!available.length) return null;
            return (
              <div key={group.title} className="rounded-[var(--radius-lg)] border border-line/60 bg-amber-50/82 p-3.5">
                <h3 className="mb-3 text-sm font-semibold tracking-tight">{group.title}</h3>
                <div className="flex flex-wrap gap-2.5">
                  {available.map((series) => (
                    <CompareChip
                      key={series.id}
                      series={series}
                      selected={selectedSeriesIds.includes(series.id)}
                      onToggle={onToggle}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <aside className="grid content-start gap-3.5">
        <PresetPanel presets={presets} activePresetId={activePresetId} onPresetSelect={onPresetSelect} />
        <SelectionPanel selectedSeries={selectedSeries} />
      </aside>
    </GlassCard>
  );
}
