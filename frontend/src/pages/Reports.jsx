import { useState } from 'react';
import { getSalesReport, getVehiclesReport, getAttendanceReport, getPerformanceReport, getPayrollReport, getClientsReport, getInventoryReport } from '@/api/reports';
import { formatCurrency } from '@/lib/utils';
import { BarChart3, FileText, Download } from 'lucide-react';

const REPORTS = [
  { id: 'sales', label: 'Ventas', fn: getSalesReport },
  { id: 'vehicles', label: 'Vehiculos', fn: getVehiclesReport },
  { id: 'attendance', label: 'Asistencia', fn: getAttendanceReport },
  { id: 'performance', label: 'Rendimiento', fn: getPerformanceReport },
  { id: 'payroll', label: 'Nomina', fn: getPayrollReport },
  { id: 'clients', label: 'Clientes', fn: getClientsReport },
  { id: 'inventory', label: 'Inventario', fn: getInventoryReport },
];

export default function Reports() {
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  async function loadReport(report) {
    setSelected(report);
    setLoading(true);
    try {
      const res = await report.fn({ from, to });
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reportes</h1>

      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Desde</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hasta</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border rounded-lg px-3 py-2" />
        </div>
        {selected && (
          <button onClick={() => loadReport(selected)} className="px-4 py-2 bg-primary text-white rounded-lg">Actualizar</button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {REPORTS.map(r => (
          <button key={r.id} onClick={() => loadReport(r)}
            className={`p-4 rounded-lg border text-center transition-colors ${selected?.id === r.id ? 'bg-primary text-white border-primary' : 'bg-white hover:bg-slate-50'}`}>
            <FileText className="h-6 w-6 mx-auto mb-2" />
            <span className="text-sm font-medium">{r.label}</span>
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}

      {!loading && data && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Reporte de {selected?.label}</h2>
          </div>
          <pre className="bg-slate-50 rounded-lg p-4 overflow-auto text-sm max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      {!selected && !loading && (
        <div className="bg-white rounded-lg border p-12 text-center text-slate-400">
          <BarChart3 className="h-12 w-12 mx-auto mb-3" />
          <p>Selecciona un tipo de reporte para generar</p>
        </div>
      )}
    </div>
  );
}
