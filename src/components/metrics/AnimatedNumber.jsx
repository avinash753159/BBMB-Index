import { useRef, useEffect, useState } from 'react';

export default function AnimatedNumber({ value, format, duration = 600 }) {
  const [display, setDisplay] = useState(() => format(value));
  const rafRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      setDisplay(format(value));
      return;
    }

    if (hasAnimated.current) {
      setDisplay(format(value));
      return;
    }

    hasAnimated.current = true;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(format(value * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, format, duration]);

  return <>{display}</>;
}
