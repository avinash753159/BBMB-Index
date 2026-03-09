import { useState, useEffect } from 'react';

export function useDataLoader() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('./dashboard-data.json')
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load dashboard data: ${r.status}`);
        return r.json();
      })
      .then((dashboardData) => {
        // pabraiNav is embedded in dashboard-data.json at build time
        const pabraiNav = dashboardData.pabraiNav ?? null;
        delete dashboardData.pabraiNav;
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
