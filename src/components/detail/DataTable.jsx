import Eyebrow from '../ui/Eyebrow';

export default function DataTable({ title, kicker, columns, rows, emptyMessage }) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-line bg-amber-50/88 p-6 shadow-card backdrop-blur-xl">
      <Eyebrow>{kicker}</Eyebrow>
      <h3 className="mt-2 text-lg font-semibold tracking-tight">{title}</h3>
      {!rows.length ? (
        <p className="mt-4 text-sm text-muted">{emptyMessage}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.label}
                    className="border-b border-line/60 pb-2 text-left text-xs font-bold uppercase tracking-widest text-muted"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-line/60 transition-colors hover:bg-white/50">
                  {columns.map((col) => (
                    <td key={col.label} className="px-2 py-3 text-sm align-top first:pl-0">
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
