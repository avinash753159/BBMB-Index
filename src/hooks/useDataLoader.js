import { useState, useEffect } from 'react';

export function useDataLoader() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('./dashboard-data.json').then((r) => {
        if (!r.ok) throw new Error(`Failed to load dashboard data: ${r.status}`);
        return r.json();
      }),
      fetch('./pabrai_nav.json').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([dashboardData, pabraiNav]) => {
        setData({ dashboardData, pabraiNav });
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { data, error, loading };
}
