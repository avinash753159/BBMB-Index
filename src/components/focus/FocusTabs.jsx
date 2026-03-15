import { useState } from 'react';
import Eyebrow from '../ui/Eyebrow';
import SeriesAvatar from '../ui/SeriesAvatar';

const TOP_COUNT = 5;

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
  const [superExpanded, setSuperExpanded] = useState(false);

  const compareSeries = allSeries.filter(item => item.category === 'compare');
  const brosSeries = allSeries.filter(item => item.category === 'bros');
  const otherSeries = allSeries.filter(item => item.category === 'other');
  const superSeries = allSeries.filter(item => item.category === 'superinvestors');

  const visibleSuper = superExpanded ? superSeries : superSeries.slice(0, TOP_COUNT);
  const hiddenCount = superSeries.length - TOP_COUNT;

  const renderChips = (series) =>
    series.map((item) => {
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
    });

  return (
    <nav aria-label="Series comparison" className="space-y-2 max-sm:space-y-3">
      {compareSeries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Eyebrow className="mr-1">Compare</Eyebrow>
          {renderChips(compareSeries)}
        </div>
      )}
      {brosSeries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Eyebrow className="mr-1">Boba Banh Mi Bros</Eyebrow>
          {renderChips(brosSeries)}
        </div>
      )}
      {otherSeries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Eyebrow className="mr-1">Other</Eyebrow>
          {renderChips(otherSeries)}
        </div>
      )}
      {superSeries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Eyebrow className="mr-1">Superinvestors</Eyebrow>
          <button
            type="button"
            onClick={() => {
              const allSuperIds = superSeries.filter((s) => !s.dimmed).map((s) => s.id);
              const allOn = allSuperIds.every((id) => selectedSeriesIds.includes(id));
              if (allOn) {
                const nonSuper = selectedSeriesIds.filter((id) => !superSeries.some(s => s.id === id));
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
          {renderChips(visibleSuper)}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setSuperExpanded(!superExpanded)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-muted transition-all duration-150 hover:border-ink hover:text-ink hover:shadow-sm"
            >
              {superExpanded ? 'Show less' : `+${hiddenCount} more`}
              <svg
                className={`h-3 w-3 transition-transform duration-200 ${superExpanded ? 'rotate-180' : ''}`}
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M3 5l3 3 3-3" />
              </svg>
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
