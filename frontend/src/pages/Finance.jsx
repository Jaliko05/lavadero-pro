import { useState, useEffect } from 'react';
import {
  listIncomes, createIncome, updateIncome, deleteIncome,
  listExpenses, createExpense, updateExpense, deleteExpense,
  listRecurringExpenses, createRecurringExpense, updateRecurringExpense, deleteRecurringExpense,
  listAccountsReceivable, createAccountReceivable, payAccountReceivable,
  getCashFlow, getProfitLoss,
} from '@/api/finance';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import DateRangePicker from '@/components/shared/DateRangePicker';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart,
} from 'recharts';

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'nequi', label: 'Nequi' },
];

const FREQUENCIES = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'quarterly', label: 'Trimestral' },
];

const EMPTY_INCOME = { category: '', description: '', amount: '', payment_method: 'efectivo', date: new Date().toISOString().slice(0, 10) };
const EMPTY_EXPENSE = { category: '', description: '', amount: '', payment_method: 'efectivo', date: new Date().toISOString().slice(0, 10) };
const EMPTY_RECURRING = { name: '', category: '', amount: '', frequency: 'monthly', due_day: 1, active: true };
const EMPTY_RECEIVABLE = { customer_name: '', description: '', total_amount: '', due_date: new Date().toISOString().slice(0, 10) };
const EMPTY_PAYMENT = { amount: '', payment_method: 'efectivo' };

function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: start.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
}

export default function Finance() {
  const [tab, setTab] = useState('overview');
  const [cashFlow, setCashFlow] = useState(null);
  const [profitLoss, setProfitLoss] = useState(null);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(todayRange);

  // Modal states per tab
  const [incomeModal, setIncomeModal] = useState(null);
  const [incomeForm, setIncomeForm] = useState(EMPTY_INCOME);

  const [expenseModal, setExpenseModal] = useState(null);
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE);

  const [recurringModal, setRecurringModal] = useState(null);
  const [recurringForm, setRecurringForm] = useState(EMPTY_RECURRING);

  const [receivableModal, setReceivableModal] = useState(null);
  const [receivableForm, setReceivableForm] = useState(EMPTY_RECEIVABLE);

  const [payModal, setPayModal] = useState(null); // holds the receivable object
  const [payForm, setPayForm] = useState(EMPTY_PAYMENT);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [cf, pl, inc, exp, rec, ar] = await Promise.allSettled([
        getCashFlow({ from: dateRange.from, to: dateRange.to, projection_days: 14 }),
        getProfitLoss({ from: dateRange.from, to: dateRange.to }),
        listIncomes(),
        listExpenses(),
        listRecurringExpenses(),
        listAccountsReceivable(),
      ]);
      if (cf.status === 'fulfilled') setCashFlow(cf.value.data);
      if (pl.status === 'fulfilled') setProfitLoss(pl.value.data);
      if (inc.status === 'fulfilled') setIncomes(inc.value.data || []);
      if (exp.status === 'fulfilled') setExpenses(exp.value.data || []);
      if (rec.status === 'fulfilled') setRecurring(rec.value.data || []);
      if (ar.status === 'fulfilled') setReceivables(ar.value.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadOverview() {
    try {
      const [cf, pl] = await Promise.allSettled([
        getCashFlow({ from: dateRange.from, to: dateRange.to, projection_days: 14 }),
        getProfitLoss({ from: dateRange.from, to: dateRange.to }),
      ]);
      if (cf.status === 'fulfilled') setCashFlow(cf.value.data);
      if (pl.status === 'fulfilled') setProfitLoss(pl.value.data);
    } catch (e) { console.error(e); }
  }

  // Build chart data combining actual daily + projection
  const chartData = (() => {
    if (!cashFlow) return [];
    const data = [];
    if (cashFlow.daily) {
      for (const d of cashFlow.daily) {
        data.push({
          date: d.date,
          income: d.income,
          expenses: d.expenses,
          net: d.net,
        });
      }
    }
    if (cashFlow.projection) {
      for (const p of cashFlow.projection) {
        data.push({
          date: p.date,
          projected_income: p.projected_income,
          projected_expenses: p.projected_expenses,
          projected_net: p.projected_net,
        });
      }
    }
    return data;
  })();

  function handleDateChange(range) {
    setDateRange(range);
  }

  useEffect(() => {
    if (!loading) loadOverview();
  }, [dateRange]);

  // --- Income CRUD ---
  function openCreateIncome() { setIncomeForm(EMPTY_INCOME); setIncomeModal('create'); }
  function openEditIncome(item) { setIncomeForm({ ...item, amount: item.amount, date: item.date?.slice(0, 10) || '' }); setIncomeModal('edit'); }

  async function handleSaveIncome(e) {
    e.preventDefault();
    const payload = { ...incomeForm, amount: parseFloat(incomeForm.amount) };
    try {
      if (incomeModal === 'create') await createIncome(payload);
      else await updateIncome(incomeForm.id, payload);
      toast.success(incomeModal === 'create' ? 'Ingreso creado' : 'Ingreso actualizado');
      setIncomeModal(null);
      const res = await listIncomes(); setIncomes(res.data || []);
      loadOverview();
    } catch { toast.error('Error al guardar ingreso'); }
  }

  async function handleDeleteIncome(id) {
    if (!confirm('Eliminar este ingreso?')) return;
    try { await deleteIncome(id); toast.success('Ingreso eliminado'); const res = await listIncomes(); setIncomes(res.data || []); loadOverview(); }
    catch { toast.error('Error al eliminar'); }
  }

  // --- Expense CRUD ---
  function openCreateExpense() { setExpenseForm(EMPTY_EXPENSE); setExpenseModal('create'); }
  function openEditExpense(item) { setExpenseForm({ ...item, amount: item.amount, date: item.date?.slice(0, 10) || '' }); setExpenseModal('edit'); }

  async function handleSaveExpense(e) {
    e.preventDefault();
    const payload = { ...expenseForm, amount: parseFloat(expenseForm.amount) };
    try {
      if (expenseModal === 'create') await createExpense(payload);
      else await updateExpense(expenseForm.id, payload);
      toast.success(expenseModal === 'create' ? 'Gasto creado' : 'Gasto actualizado');
      setExpenseModal(null);
      const res = await listExpenses(); setExpenses(res.data || []);
      loadOverview();
    } catch { toast.error('Error al guardar gasto'); }
  }

  async function handleDeleteExpense(id) {
    if (!confirm('Eliminar este gasto?')) return;
    try { await deleteExpense(id); toast.success('Gasto eliminado'); const res = await listExpenses(); setExpenses(res.data || []); loadOverview(); }
    catch { toast.error('Error al eliminar'); }
  }

  // --- Recurring Expense CRUD ---
  function openCreateRecurring() { setRecurringForm(EMPTY_RECURRING); setRecurringModal('create'); }
  function openEditRecurring(item) { setRecurringForm({ ...item, amount: item.amount }); setRecurringModal('edit'); }

  async function handleSaveRecurring(e) {
    e.preventDefault();
    const payload = { ...recurringForm, amount: parseFloat(recurringForm.amount), due_day: parseInt(recurringForm.due_day) };
    try {
      if (recurringModal === 'create') await createRecurringExpense(payload);
      else await updateRecurringExpense(recurringForm.id, payload);
      toast.success(recurringModal === 'create' ? 'Gasto recurrente creado' : 'Gasto recurrente actualizado');
      setRecurringModal(null);
      const res = await listRecurringExpenses(); setRecurring(res.data || []);
    } catch { toast.error('Error al guardar gasto recurrente'); }
  }

  async function handleDeleteRecurring(id) {
    if (!confirm('Eliminar este gasto recurrente?')) return;
    try { await deleteRecurringExpense(id); toast.success('Eliminado'); const res = await listRecurringExpenses(); setRecurring(res.data || []); }
    catch { toast.error('Error al eliminar'); }
  }

  // --- Accounts Receivable ---
  function openCreateReceivable() { setReceivableForm(EMPTY_RECEIVABLE); setReceivableModal('create'); }

  async function handleSaveReceivable(e) {
    e.preventDefault();
    const payload = { ...receivableForm, total_amount: parseFloat(receivableForm.total_amount) };
    try {
      await createAccountReceivable(payload);
      toast.success('Cuenta por cobrar creada');
      setReceivableModal(null);
      const res = await listAccountsReceivable(); setReceivables(res.data || []);
    } catch { toast.error('Error al crear cuenta por cobrar'); }
  }

  function openPayModal(receivable) { setPayModal(receivable); setPayForm(EMPTY_PAYMENT); }

  async function handlePay(e) {
    e.preventDefault();
    const payload = { amount: parseFloat(payForm.amount), payment_method: payForm.payment_method };
    try {
      await payAccountReceivable(payModal.id, payload);
      toast.success('Pago registrado');
      setPayModal(null);
      const res = await listAccountsReceivable(); setReceivables(res.data || []);
      loadOverview();
    } catch { toast.error('Error al registrar pago'); }
  }

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const tabs = [
    { id: 'overview', label: 'Resumen' },
    { id: 'incomes', label: 'Ingresos' },
    { id: 'expenses', label: 'Gastos' },
    { id: 'recurring', label: 'Recurrentes' },
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

      {/* ==================== RESUMEN ==================== */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <DateRangePicker from={dateRange.from} to={dateRange.to} onChange={handleDateChange} />

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

          {/* Cash Flow Chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="font-semibold mb-4">Flujo de Caja</h2>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => { const d = new Date(v + 'T12:00:00'); return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }); }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                  <Tooltip
                    formatter={(value, name) => [formatCurrency(value), name]}
                    labelFormatter={(label) => new Date(label + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' })}
                  />
                  <Legend />
                  {/* Actual data */}
                  <Area type="monotone" dataKey="income" name="Ingresos" stroke="#16a34a" fill="#bbf7d0" fillOpacity={0.6} strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" name="Gastos" stroke="#dc2626" fill="#fecaca" fillOpacity={0.6} strokeWidth={2} />
                  <Line type="monotone" dataKey="net" name="Neto" stroke="#2563eb" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  {/* Projected data */}
                  <Area type="monotone" dataKey="projected_income" name="Ingreso Proyectado" stroke="#16a34a" fill="#bbf7d0" fillOpacity={0.3} strokeWidth={1.5} strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="projected_expenses" name="Gasto Proyectado" stroke="#dc2626" fill="#fecaca" fillOpacity={0.3} strokeWidth={1.5} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="projected_net" name="Neto Proyectado" stroke="#2563eb" strokeWidth={1.5} strokeDasharray="2 6" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ==================== INGRESOS ==================== */}
      {tab === 'incomes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openCreateIncome} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nuevo Ingreso
            </button>
          </div>

          <div className="bg-white rounded-lg border">
            <table className="w-full">
              <thead><tr className="border-b text-left text-sm text-slate-500">
                <th className="p-3">Fecha</th><th className="p-3">Categoria</th><th className="p-3">Descripcion</th><th className="p-3">Metodo</th><th className="p-3 text-right">Monto</th><th className="p-3 text-right">Acciones</th>
              </tr></thead>
              <tbody>
                {incomes.map(item => (
                  <tr key={item.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 text-sm">{new Date(item.date).toLocaleDateString('es-CO')}</td>
                    <td className="p-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{item.category}</span></td>
                    <td className="p-3 text-sm">{item.description}</td>
                    <td className="p-3 text-sm capitalize">{item.payment_method}</td>
                    <td className="p-3 text-right font-medium text-green-600">{formatCurrency(item.amount)}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => openEditIncome(item)} className="p-1 hover:bg-slate-100 rounded"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteIncome(item.id)} className="p-1 hover:bg-red-50 rounded text-red-500 ml-1"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
                {incomes.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-400">Sin ingresos registrados</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== GASTOS ==================== */}
      {tab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openCreateExpense} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nuevo Gasto
            </button>
          </div>

          <div className="bg-white rounded-lg border">
            <table className="w-full">
              <thead><tr className="border-b text-left text-sm text-slate-500">
                <th className="p-3">Fecha</th><th className="p-3">Categoria</th><th className="p-3">Descripcion</th><th className="p-3">Metodo</th><th className="p-3 text-right">Monto</th><th className="p-3 text-right">Acciones</th>
              </tr></thead>
              <tbody>
                {expenses.map(item => (
                  <tr key={item.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 text-sm">{new Date(item.date).toLocaleDateString('es-CO')}</td>
                    <td className="p-3"><span className="px-2 py-1 bg-slate-100 rounded text-xs">{item.category}</span></td>
                    <td className="p-3 text-sm">{item.description}</td>
                    <td className="p-3 text-sm capitalize">{item.payment_method}</td>
                    <td className="p-3 text-right font-medium text-red-600">{formatCurrency(item.amount)}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => openEditExpense(item)} className="p-1 hover:bg-slate-100 rounded"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteExpense(item.id)} className="p-1 hover:bg-red-50 rounded text-red-500 ml-1"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-400">Sin gastos registrados</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== RECURRENTES ==================== */}
      {tab === 'recurring' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openCreateRecurring} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nuevo Recurrente
            </button>
          </div>

          <div className="bg-white rounded-lg border">
            <table className="w-full">
              <thead><tr className="border-b text-left text-sm text-slate-500">
                <th className="p-3">Nombre</th><th className="p-3">Categoria</th><th className="p-3">Frecuencia</th><th className="p-3">Dia</th><th className="p-3 text-right">Monto</th><th className="p-3">Estado</th><th className="p-3 text-right">Acciones</th>
              </tr></thead>
              <tbody>
                {recurring.map(item => (
                  <tr key={item.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-medium text-sm">{item.name}</td>
                    <td className="p-3"><span className="px-2 py-1 bg-slate-100 rounded text-xs">{item.category}</span></td>
                    <td className="p-3 text-sm capitalize">{FREQUENCIES.find(f => f.value === item.frequency)?.label || item.frequency}</td>
                    <td className="p-3 text-sm">{item.due_day}</td>
                    <td className="p-3 text-right font-medium">{formatCurrency(item.amount)}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded ${item.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {item.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => openEditRecurring(item)} className="p-1 hover:bg-slate-100 rounded"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteRecurring(item.id)} className="p-1 hover:bg-red-50 rounded text-red-500 ml-1"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
                {recurring.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-slate-400">Sin gastos recurrentes</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== CUENTAS POR COBRAR ==================== */}
      {tab === 'receivables' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openCreateReceivable} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nueva Cuenta
            </button>
          </div>

          <div className="bg-white rounded-lg border">
            <table className="w-full">
              <thead><tr className="border-b text-left text-sm text-slate-500">
                <th className="p-3">Cliente</th><th className="p-3">Descripcion</th><th className="p-3 text-right">Total</th><th className="p-3 text-right">Pagado</th><th className="p-3 text-right">Pendiente</th><th className="p-3">Estado</th><th className="p-3 text-right">Acciones</th>
              </tr></thead>
              <tbody>
                {receivables.map(item => (
                  <tr key={item.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 text-sm">{item.customer_name || item.customer_id?.slice(0, 8) || '-'}</td>
                    <td className="p-3 text-sm">{item.description || '-'}</td>
                    <td className="p-3 text-right">{formatCurrency(item.total_amount)}</td>
                    <td className="p-3 text-right text-green-600">{formatCurrency(item.paid_amount)}</td>
                    <td className="p-3 text-right text-red-600">{formatCurrency(item.total_amount - item.paid_amount)}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded ${item.status === 'al_dia' ? 'bg-green-100 text-green-700' : item.status === 'en_mora' ? 'bg-yellow-100 text-yellow-700' : item.status === 'pagado' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {item.status !== 'pagado' && (
                        <button onClick={() => openPayModal(item)} className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700">
                          Registrar Pago
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {receivables.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-slate-400">Sin cuentas por cobrar</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== MODAL: INGRESO ==================== */}
      {incomeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIncomeModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{incomeModal === 'create' ? 'Nuevo Ingreso' : 'Editar Ingreso'}</h3>
            <form onSubmit={handleSaveIncome} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <input value={incomeForm.category} onChange={e => setIncomeForm({ ...incomeForm, category: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Monto</label>
                  <input type="number" step="0.01" min="0" value={incomeForm.amount} onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Descripcion</label>
                  <input value={incomeForm.description} onChange={e => setIncomeForm({ ...incomeForm, description: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Metodo de Pago</label>
                  <select value={incomeForm.payment_method} onChange={e => setIncomeForm({ ...incomeForm, payment_method: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha</label>
                  <input type="date" value={incomeForm.date} onChange={e => setIncomeForm({ ...incomeForm, date: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIncomeModal(null)} className="flex-1 border rounded-lg py-2">Cancelar</button>
                <button type="submit" className="flex-1 bg-primary text-white rounded-lg py-2">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: GASTO ==================== */}
      {expenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setExpenseModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{expenseModal === 'create' ? 'Nuevo Gasto' : 'Editar Gasto'}</h3>
            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <input value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Monto</label>
                  <input type="number" step="0.01" min="0" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Descripcion</label>
                  <input value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Metodo de Pago</label>
                  <select value={expenseForm.payment_method} onChange={e => setExpenseForm({ ...expenseForm, payment_method: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha</label>
                  <input type="date" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setExpenseModal(null)} className="flex-1 border rounded-lg py-2">Cancelar</button>
                <button type="submit" className="flex-1 bg-primary text-white rounded-lg py-2">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: RECURRENTE ==================== */}
      {recurringModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setRecurringModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{recurringModal === 'create' ? 'Nuevo Gasto Recurrente' : 'Editar Gasto Recurrente'}</h3>
            <form onSubmit={handleSaveRecurring} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <input value={recurringForm.name} onChange={e => setRecurringForm({ ...recurringForm, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <input value={recurringForm.category} onChange={e => setRecurringForm({ ...recurringForm, category: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Monto</label>
                  <input type="number" step="0.01" min="0" value={recurringForm.amount} onChange={e => setRecurringForm({ ...recurringForm, amount: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Frecuencia</label>
                  <select value={recurringForm.frequency} onChange={e => setRecurringForm({ ...recurringForm, frequency: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Dia de Cobro</label>
                  <input type="number" min="1" max="31" value={recurringForm.due_day} onChange={e => setRecurringForm({ ...recurringForm, due_day: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <label className="text-sm font-medium">Activo</label>
                  <button type="button" onClick={() => setRecurringForm({ ...recurringForm, active: !recurringForm.active })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${recurringForm.active ? 'bg-green-500' : 'bg-slate-300'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${recurringForm.active ? 'translate-x-5' : ''}`} />
                  </button>
                  <span className="text-sm text-slate-500">{recurringForm.active ? 'Si' : 'No'}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setRecurringModal(null)} className="flex-1 border rounded-lg py-2">Cancelar</button>
                <button type="submit" className="flex-1 bg-primary text-white rounded-lg py-2">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: NUEVA CUENTA POR COBRAR ==================== */}
      {receivableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setReceivableModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Nueva Cuenta por Cobrar</h3>
            <form onSubmit={handleSaveReceivable} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nombre del Cliente</label>
                  <input value={receivableForm.customer_name} onChange={e => setReceivableForm({ ...receivableForm, customer_name: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Descripcion</label>
                  <input value={receivableForm.description} onChange={e => setReceivableForm({ ...receivableForm, description: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Monto Total</label>
                  <input type="number" step="0.01" min="0" value={receivableForm.total_amount} onChange={e => setReceivableForm({ ...receivableForm, total_amount: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha Limite</label>
                  <input type="date" value={receivableForm.due_date} onChange={e => setReceivableForm({ ...receivableForm, due_date: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setReceivableModal(null)} className="flex-1 border rounded-lg py-2">Cancelar</button>
                <button type="submit" className="flex-1 bg-primary text-white rounded-lg py-2">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: REGISTRAR PAGO ==================== */}
      {payModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPayModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Registrar Pago</h3>
            <div className="mb-4 p-3 bg-slate-50 rounded-lg text-sm space-y-1">
              <p>Cliente: <span className="font-medium">{payModal.customer_name || payModal.customer_id?.slice(0, 8)}</span></p>
              <p>Total: <span className="font-medium">{formatCurrency(payModal.total_amount)}</span></p>
              <p>Pagado: <span className="font-medium text-green-600">{formatCurrency(payModal.paid_amount)}</span></p>
              <p>Pendiente: <span className="font-medium text-red-600">{formatCurrency(payModal.total_amount - payModal.paid_amount)}</span></p>
            </div>
            <form onSubmit={handlePay} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Monto del Pago</label>
                  <input type="number" step="0.01" min="0" max={payModal.total_amount - payModal.paid_amount} value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Metodo de Pago</label>
                  <select value={payForm.payment_method} onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setPayModal(null)} className="flex-1 border rounded-lg py-2">Cancelar</button>
                <button type="submit" className="flex-1 bg-green-600 text-white rounded-lg py-2 hover:bg-green-700">Registrar Pago</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ icon, color, label, value }) {
  const bgColors = { green: 'bg-green-100', red: 'bg-red-100', blue: 'bg-blue-100', purple: 'bg-purple-100' };
  return (
    <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
      <div className={`p-2 ${bgColors[color] || 'bg-slate-100'} rounded-lg`}>{icon}</div>
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
