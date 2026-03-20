import { useState, useEffect } from 'react';
import { listExpenses, listRecurringExpenses, getCashFlow, getProfitLoss, listAccountsReceivable } from '@/api/finance';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Finance() {
  const [tab, setTab] = useState('overview');
  const [cashFlow, setCashFlow] = useState(null);
  const [profitLoss, setProfitLoss] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [cf, pl, exp, rec, ar] = await Promise.allSettled([
        getCashFlow(), getProfitLoss(), listExpenses(), listRecurringExpenses(), listAccountsReceivable(),
      ]);
      if (cf.status === 'fulfilled') setCashFlow(cf.value.data);
      if (pl.status === 'fulfilled') setProfitLoss(pl.value.data);
      if (exp.status === 'fulfilled') setExpenses(exp.value.data);
      if (rec.status === 'fulfilled') setRecurring(rec.value.data);
      if (ar.status === 'fulfilled') setReceivables(ar.value.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const tabs = [
    { id: 'overview', label: 'Resumen' },
    { id: 'expenses', label: 'Gastos' },
    { id: 'recurring', label: 'Gastos Recurrentes' },
    { id: 'receivables', label: 'Cuentas por Cobrar' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Finanzas</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.id ? 'bg-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card icon={<ArrowUpRight className="h-5 w-5 text-green-600" />} color="green" label="Ingresos" value={formatCurrency(cashFlow?.total_income || 0)} />
            <Card icon={<ArrowDownRight className="h-5 w-5 text-red-600" />} color="red" label="Gastos" value={formatCurrency(cashFlow?.total_expense || 0)} />
            <Card icon={<DollarSign className="h-5 w-5 text-blue-600" />} color="blue" label="Flujo Neto" value={formatCurrency(cashFlow?.net || 0)} />
            <Card icon={<TrendingUp className="h-5 w-5 text-purple-600" />} color="purple" label="Margen" value={`${(profitLoss?.profit_margin || 0).toFixed(1)}%`} />
          </div>

          {profitLoss && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="font-semibold mb-4">Estado de Resultados</h2>
              <div className="space-y-3">
                <Row label="Ingresos" value={formatCurrency(profitLoss.revenue)} positive />
                <Row label="Gastos Operativos" value={formatCurrency(profitLoss.expenses)} />
                <Row label="Nomina" value={formatCurrency(profitLoss.payroll)} />
                <div className="border-t pt-3">
                  <Row label="Costos Totales" value={formatCurrency(profitLoss.total_costs)} bold />
                </div>
                <div className="border-t pt-3">
                  <Row label="Utilidad" value={formatCurrency(profitLoss.profit)} positive={profitLoss.profit > 0} bold />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'expenses' && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b"><h2 className="font-semibold">Gastos</h2></div>
          <table className="w-full">
            <thead><tr className="border-b text-left text-sm text-slate-500">
              <th className="p-3">Fecha</th><th className="p-3">Categoria</th><th className="p-3">Descripcion</th><th className="p-3 text-right">Monto</th>
            </tr></thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 text-sm">{new Date(e.date).toLocaleDateString('es-CO')}</td>
                  <td className="p-3"><span className="px-2 py-1 bg-slate-100 rounded text-xs">{e.category}</span></td>
                  <td className="p-3 text-sm">{e.description}</td>
                  <td className="p-3 text-right font-medium text-red-600">{formatCurrency(e.amount)}</td>
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-slate-400">Sin gastos registrados</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'recurring' && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b"><h2 className="font-semibold">Gastos Recurrentes</h2></div>
          <div className="divide-y">
            {recurring.map(r => (
              <div key={r.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-sm text-slate-500">{r.category} | {r.frequency} | Dia {r.due_day}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(r.amount)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${r.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {r.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            ))}
            {recurring.length === 0 && <p className="p-8 text-center text-slate-400">Sin gastos recurrentes</p>}
          </div>
        </div>
      )}

      {tab === 'receivables' && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b"><h2 className="font-semibold">Cuentas por Cobrar</h2></div>
          <table className="w-full">
            <thead><tr className="border-b text-left text-sm text-slate-500">
              <th className="p-3">Cliente</th><th className="p-3 text-right">Total</th><th className="p-3 text-right">Pagado</th><th className="p-3 text-right">Pendiente</th><th className="p-3">Estado</th>
            </tr></thead>
            <tbody>
              {receivables.map(r => (
                <tr key={r.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 text-sm">{r.customer_id?.slice(0, 8)}</td>
                  <td className="p-3 text-right">{formatCurrency(r.total_amount)}</td>
                  <td className="p-3 text-right text-green-600">{formatCurrency(r.paid_amount)}</td>
                  <td className="p-3 text-right text-red-600">{formatCurrency(r.total_amount - r.paid_amount)}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded ${r.status === 'al_dia' ? 'bg-green-100 text-green-700' : r.status === 'en_mora' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {receivables.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-400">Sin cuentas por cobrar</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Card({ icon, color, label, value }) {
  return (
    <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
      <div className={`p-2 bg-${color}-100 rounded-lg`}>{icon}</div>
      <div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></div>
    </div>
  );
}

function Row({ label, value, positive, bold }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-semibold' : ''}`}>
      <span>{label}</span>
      <span className={positive ? 'text-green-600' : positive === false ? 'text-red-600' : ''}>{value}</span>
    </div>
  );
}
