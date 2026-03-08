import Eyebrow from '../ui/Eyebrow';

export default function DataTable({ title, kicker, columns, rows, emptyMessage }) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-line bg-surface p-5">
      <Eyebrow>{kicker}</Eyebrow>
      <h3 className="mt-1.5 text-base font-semibold tracking-tight">{title}</h3>
      {!rows.length ? (
        <p className="mt-3 text-sm text-muted">{emptyMessage}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.label}
                    className="border-b border-line pb-2 text-left text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-subtle"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-line/60 transition-colors hover:bg-bg/50">
                  {columns.map((col) => (
                    <td key={col.label} className="px-2 py-2.5 text-sm align-top first:pl-0">
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
