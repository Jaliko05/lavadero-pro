import { Calendar } from 'lucide-react';

const PRESETS = [
  { label: 'Hoy', getValue: () => { const d = new Date().toISOString().slice(0, 10); return { from: d, to: d }; } },
  { label: 'Esta semana', getValue: () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return { from: start.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
  }},
  { label: 'Este mes', getValue: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: start.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
  }},
  { label: 'Ultimo mes', getValue: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
  }},
];

export default function DateRangePicker({ from, to, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-slate-400" />
        <input
          type="date"
          value={from}
          onChange={e => onChange({ from: e.target.value, to })}
          className="border rounded-lg px-2 py-1.5 text-sm"
        />
        <span className="text-slate-400">-</span>
        <input
          type="date"
          value={to}
          onChange={e => onChange({ from, to: e.target.value })}
          className="border rounded-lg px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex gap-1">
        {PRESETS.map(p => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.getValue())}
            className="px-2 py-1 text-xs rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
