import { useState, useCallback, useRef } from 'react';

export function useChartInteraction() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [hoveredSeriesId, setHoveredSeriesId] = useState(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  const clearHover = useCallback(() => {
    setHoveredIndex(null);
    setHoveredSeriesId(null);
  }, []);

  return {
    hoveredIndex,
    hoveredSeriesId,
    mouseRef,
    setHoveredIndex,
    setHoveredSeriesId,
    clearHover,
  };
}
