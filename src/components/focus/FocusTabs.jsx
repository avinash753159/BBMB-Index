import Eyebrow from '../ui/Eyebrow';
import SeriesAvatar from '../ui/SeriesAvatar';

function FilterChip({ on, dimmed, matchInfo, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
        dimmed
          ? 'border-line/50 bg-white/50 text-muted opacity-60'
          : on
            ? 'border-ink bg-ink text-white shadow-md'
            : 'border-line bg-white text-ink hover:border-ink hover:shadow-sm'
      }`}
    >
      {children}
      {matchInfo && (
        <span className="ml-1 text-[0.65rem] opacity-70">{matchInfo.matched}/{matchInfo.total}</span>
      )}
    </button>
  );
}

export default function FocusTabs({ views, allSeries, selectedSeriesIds, onToggle, onSetSeries, activeView, onViewChange, maxDisplay = 5 }) {
  const superIds = new Set(
    allSeries.filter(item => {
      const view = views.find(v => v.id === item.id);
      return view?.kind === 'superinvestor';
    }).map(item => item.id)
  );
  const brosSeries = allSeries.filter((item) => !superIds.has(item.id));
  const superSeries = allSeries.filter((item) => superIds.has(item.id));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Eyebrow className="mr-1">Compare</Eyebrow>
        {brosSeries.map((item) => {
          const isOn = selectedSeriesIds.includes(item.id);
          return (
            <FilterChip
              key={item.id}
              on={isOn}
              dimmed={item.dimmed}
              matchInfo={item.matchCount}
              onClick={() => {
                onToggle(item.id);
                const hasView = views.some((v) => v.id === item.id);
                if (hasView) onViewChange(item.id);
              }}
            >
              <SeriesAvatar id={item.id} size="xs" />
              {item.label}
            </FilterChip>
          );
        })}
      </div>
      {superSeries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Eyebrow className="mr-1">Superinvestors</Eyebrow>
          <button
            type="button"
            onClick={() => {
              const allSuperIds = superSeries.filter((s) => !s.dimmed).map((s) => s.id);
              const allOn = allSuperIds.every((id) => selectedSeriesIds.includes(id));
              if (allOn) {
                const nonSuper = selectedSeriesIds.filter((id) => !superIds.has(id));
                onSetSeries(nonSuper.length ? nonSuper : ['SPY']);
              } else {
                onSetSeries([...new Set(['SPY', ...selectedSeriesIds, ...allSuperIds])]);
              }
            }}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all duration-150 ${
              superSeries.filter((s) => !s.dimmed).every((s) => selectedSeriesIds.includes(s.id))
                ? 'border-ink bg-ink text-white shadow-md'
                : 'border-line bg-white text-muted hover:border-ink hover:text-ink hover:shadow-sm'
            }`}
          >
            All
          </button>
          {superSeries.map((item) => {
            const isOn = selectedSeriesIds.includes(item.id);
            return (
              <FilterChip
                key={item.id}
                on={isOn}
                dimmed={item.dimmed}
                matchInfo={item.matchCount}
                onClick={() => {
                  onToggle(item.id);
                  const hasView = views.some((v) => v.id === item.id);
                  if (hasView) onViewChange(item.id);
                }}
              >
                <SeriesAvatar id={item.id} size="xs" />
                {item.label}
              </FilterChip>
            );
          })}
        </div>
      )}
    </div>
  );
}
