import { useState, useEffect } from 'react';
import { generatePayroll, listPayroll, getPayroll, approvePayroll } from '@/api/payroll';
import { listEmployees, updateEmployee } from '@/api/employees';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import {
  DollarSign, Users, CheckCircle, Calendar, FileText,
  ChevronDown, ChevronUp, Clock, Settings, Edit2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import EmptyState from '@/components/shared/EmptyState';

const PAYMENT_TYPE_LABELS = {
  fixed_salary: 'Salario Fijo',
  per_wash: 'Por Lavado',
  percentage: 'Porcentaje',
};

const PAYMENT_TYPE_COLORS = {
  fixed_salary: 'bg-blue-100 text-blue-700',
  per_wash: 'bg-orange-100 text-orange-700',
  percentage: 'bg-purple-100 text-purple-700',
};

function getQuincenaDates() {
  const now = new Date();
  const day = now.getDate();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (day <= 15) {
    return {
      period_start: new Date(y, m, 1).toISOString().slice(0, 10),
      period_end: new Date(y, m, 15).toISOString().slice(0, 10),
    };
  }
  return {
    period_start: new Date(y, m, 16).toISOString().slice(0, 10),
    period_end: new Date(y, m + 1, 0).toISOString().slice(0, 10),
  };
}

function getMonthDates() {
  const now = new Date();
  return {
    period_start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    period_end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
  };
}

function getLastWeekDates() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - dayOfWeek - 6);
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  return {
    period_start: lastMonday.toISOString().slice(0, 10),
    period_end: lastSunday.toISOString().slice(0, 10),
  };
}

export default function Payroll() {
  const [activeTab, setActiveTab] = useState('liquidacion');
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Liquidacion tab
  const [generating, setGenerating] = useState(false);
  const [genForm, setGenForm] = useState(getQuincenaDates());
  const [generatedPayroll, setGeneratedPayroll] = useState(null);
  const [generatedItems, setGeneratedItems] = useState([]);

  // Historial tab
  const [expandedId, setExpandedId] = useState(null);
  const [expandedItems, setExpandedItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Approve confirm
  const [approveConfirm, setApproveConfirm] = useState(null);

  // Config tab - edit modal
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ payment_type: 'fixed_salary', amount_per_wash: 0, percentage_rate: 0, base_salary: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [pr, emp] = await Promise.allSettled([listPayroll(), listEmployees()]);
      if (pr.status === 'fulfilled') setPayrolls(pr.value.data || []);
      if (emp.status === 'fulfilled') setEmployees(Array.isArray(emp.value.data) ? emp.value.data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  // --- Liquidacion ---
  async function handleGenerate(e) {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await generatePayroll(genForm);
      toast.success('Liquidacion generada exitosamente');
      const payroll = res.data;
      setGeneratedPayroll(payroll);
      // Fetch items for the generated payroll
      if (payroll?.id) {
        try {
          const detail = await getPayroll(payroll.id);
          setGeneratedItems(detail.data?.items || []);
        } catch { setGeneratedItems([]); }
      }
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al generar liquidacion');
    } finally { setGenerating(false); }
  }

  function applyPreset(preset) {
    if (preset === 'quincena') setGenForm(getQuincenaDates());
    else if (preset === 'mes') setGenForm(getMonthDates());
    else if (preset === 'semana') setGenForm(getLastWeekDates());
  }

  async function handleApproveGenerated() {
    if (!generatedPayroll?.id) return;
    try {
      await approvePayroll(generatedPayroll.id);
      toast.success('Liquidacion aprobada');
      setGeneratedPayroll(null);
      setGeneratedItems([]);
      loadData();
    } catch { toast.error('Error al aprobar liquidacion'); }
  }

  // --- Historial ---
  async function toggleExpand(id) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    setLoadingItems(true);
    try {
      const res = await getPayroll(id);
      setExpandedItems(res.data?.items || []);
    } catch { setExpandedItems([]); }
    finally { setLoadingItems(false); }
  }

  async function handleApprove() {
    if (!approveConfirm) return;
    try {
      await approvePayroll(approveConfirm);
      toast.success('Nomina aprobada');
      setApproveConfirm(null);
      loadData();
    } catch { toast.error('Error al aprobar'); }
  }

  // --- Config ---
  function openEditPaymentConfig(emp) {
    setEditForm({
      payment_type: emp.payment_type || 'fixed_salary',
      amount_per_wash: emp.amount_per_wash || 0,
      percentage_rate: emp.percentage_rate || 0,
      base_salary: emp.base_salary || 0,
    });
    setEditModal(emp);
  }

  async function handleSavePaymentConfig(e) {
    e.preventDefault();
    if (!editModal) return;
    setSaving(true);
    try {
      await updateEmployee(editModal.id, {
        ...editModal,
        payment_type: editForm.payment_type,
        amount_per_wash: Number(editForm.amount_per_wash),
        percentage_rate: Number(editForm.percentage_rate),
        base_salary: Number(editForm.base_salary),
      });
      toast.success('Configuracion de pago actualizada');
      setEditModal(null);
      loadData();
    } catch { toast.error('Error al guardar configuracion'); }
    finally { setSaving(false); }
  }

  function getEmployeeName(id) {
    return employees.find(e => e.id === id)?.full_name || `ID ${id}`;
  }

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const TABS = [
    { key: 'liquidacion', label: 'Liquidacion', icon: FileText },
    { key: 'historial', label: 'Historial', icon: Clock },
    { key: 'configuracion', label: 'Configuracion', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nomina</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* === LIQUIDACION TAB === */}
      {activeTab === 'liquidacion' && (
        <>
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Generar Liquidacion</h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-2">
                <button type="button" onClick={() => applyPreset('quincena')}
                  className="px-3 py-1 text-sm rounded-lg border hover:bg-slate-50 transition-colors">
                  Esta quincena
                </button>
                <button type="button" onClick={() => applyPreset('mes')}
                  className="px-3 py-1 text-sm rounded-lg border hover:bg-slate-50 transition-colors">
                  Este mes
                </button>
                <button type="button" onClick={() => applyPreset('semana')}
                  className="px-3 py-1 text-sm rounded-lg border hover:bg-slate-50 transition-colors">
                  Semana pasada
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha Inicio</label>
                  <input type="date" value={genForm.period_start}
                    onChange={e => setGenForm({ ...genForm, period_start: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha Fin</label>
                  <input type="date" value={genForm.period_end}
                    onChange={e => setGenForm({ ...genForm, period_end: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2" required />
                </div>
              </div>
              <p className="text-sm text-slate-500">Se generara la liquidacion para todos los empleados activos en el periodo seleccionado.</p>
              <button type="submit" disabled={generating}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {generating ? 'Generando...' : 'Generar Liquidacion'}
              </button>
            </form>
          </div>

          {/* Generated payroll result */}
          {generatedPayroll && (
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Liquidacion Generada</h3>
                  <p className="text-sm text-slate-500">
                    Periodo: {formatDate(generatedPayroll.period_start)} - {formatDate(generatedPayroll.period_end)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded font-medium bg-yellow-100 text-yellow-700">Borrador</span>
                  <button onClick={handleApproveGenerated}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Aprobar
                  </button>
                </div>
              </div>
              {generatedItems.length === 0 ? (
                <p className="p-6 text-center text-slate-400 text-sm">Sin detalle disponible</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-slate-500">
                      <th className="p-3">Empleado</th>
                      <th className="p-3">Tipo Pago</th>
                      <th className="p-3 text-right">Turnos</th>
                      <th className="p-3 text-right">Tarifa</th>
                      <th className="p-3 text-right">Bruto</th>
                      <th className="p-3 text-right">Deducciones</th>
                      <th className="p-3 text-right font-semibold">Neto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedItems.map((item, idx) => (
                      <tr key={item.id || idx} className="border-b hover:bg-slate-50">
                        <td className="p-3 font-medium">{item.employee_name || getEmployeeName(item.employee_id)}</td>
                        <td className="p-3">
                          <span className={cn('text-xs px-2 py-1 rounded font-medium', PAYMENT_TYPE_COLORS[item.payment_type] || 'bg-slate-100 text-slate-600')}>
                            {PAYMENT_TYPE_LABELS[item.payment_type] || item.payment_type || '-'}
                          </span>
                        </td>
                        <td className="p-3 text-right">{item.turns_count || item.days_worked || '-'}</td>
                        <td className="p-3 text-right">{item.rate ? formatCurrency(item.rate) : item.percentage_rate ? `${item.percentage_rate}%` : '-'}</td>
                        <td className="p-3 text-right">{formatCurrency(item.gross_pay || item.base_salary || 0)}</td>
                        <td className="p-3 text-right text-red-600">{formatCurrency(item.deductions || 0)}</td>
                        <td className="p-3 text-right font-bold text-green-600">{formatCurrency(item.net_pay || item.total || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {/* === HISTORIAL TAB === */}
      {activeTab === 'historial' && (
        <>
          {payrolls.length === 0 ? (
            <EmptyState icon={FileText} title="Sin nominas" description="No hay nominas generadas aun" />
          ) : (
            <div className="space-y-3">
              {payrolls.map(pr => {
                const isExpanded = expandedId === pr.id;
                const isPending = pr.status === 'pendiente' || pr.status === 'draft';
                const isPaid = pr.status === 'paid' || pr.status === 'pagada';
                return (
                  <div key={pr.id} className="bg-white rounded-lg border">
                    <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50" onClick={() => toggleExpand(pr.id)}>
                      <div className="flex items-center gap-4">
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        <div>
                          <p className="font-semibold">Periodo: {formatDate(pr.period_start)} - {formatDate(pr.period_end)}</p>
                          <p className="text-sm text-slate-500">{pr.employee_count || '-'} empleados</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          'text-xs px-2 py-1 rounded font-medium',
                          isPending ? 'bg-yellow-100 text-yellow-700' :
                          isPaid ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        )}>
                          {isPending ? 'Borrador' : isPaid ? 'Pagada' : 'Aprobada'}
                        </span>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Bruto: {formatCurrency(pr.total_gross || pr.total || 0)}</p>
                          <p className="font-bold text-lg">{formatCurrency(pr.total_net || pr.total || 0)}</p>
                        </div>
                        {isPending && (
                          <button onClick={e => { e.stopPropagation(); setApproveConfirm(pr.id); }}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                            Aprobar
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t">
                        {loadingItems ? (
                          <div className="flex justify-center p-6"><div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" /></div>
                        ) : expandedItems.length === 0 ? (
                          <p className="p-6 text-center text-slate-400 text-sm">Sin detalle disponible</p>
                        ) : (
                          <table className="w-full">
                            <thead><tr className="border-b text-left text-sm text-slate-500">
                              <th className="p-3">Empleado</th>
                              <th className="p-3">Tipo Pago</th>
                              <th className="p-3 text-right">Turnos</th>
                              <th className="p-3 text-right">Bruto</th>
                              <th className="p-3 text-right">Deducciones</th>
                              <th className="p-3 text-right font-semibold">Neto</th>
                            </tr></thead>
                            <tbody>
                              {expandedItems.map((item, idx) => (
                                <tr key={item.id || idx} className="border-b hover:bg-slate-50">
                                  <td className="p-3 font-medium">{item.employee_name || getEmployeeName(item.employee_id)}</td>
                                  <td className="p-3">
                                    <span className={cn('text-xs px-2 py-1 rounded font-medium', PAYMENT_TYPE_COLORS[item.payment_type] || 'bg-slate-100 text-slate-600')}>
                                      {PAYMENT_TYPE_LABELS[item.payment_type] || item.payment_type || '-'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">{item.turns_count || item.days_worked || '-'}</td>
                                  <td className="p-3 text-right">{formatCurrency(item.gross_pay || item.base_salary || 0)}</td>
                                  <td className="p-3 text-right text-red-600">{formatCurrency(item.deductions || 0)}</td>
                                  <td className="p-3 text-right font-bold text-green-600">{formatCurrency(item.net_pay || item.total || 0)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* === CONFIGURACION TAB === */}
      {activeTab === 'configuracion' && (
        <>
          <p className="text-sm text-slate-500">Configure el esquema de pago de cada empleado</p>
          {employees.length === 0 ? (
            <EmptyState icon={Users} title="Sin empleados" description="No hay empleados registrados" />
          ) : (
            <div className="bg-white rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-slate-500">
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Tipo de Pago</th>
                    <th className="p-3 text-right">Tarifa</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-medium">{emp.full_name}</td>
                      <td className="p-3">
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 capitalize">{emp.role}</span>
                      </td>
                      <td className="p-3">
                        <span className={cn('text-xs px-2 py-1 rounded font-medium', PAYMENT_TYPE_COLORS[emp.payment_type] || 'bg-slate-100 text-slate-600')}>
                          {PAYMENT_TYPE_LABELS[emp.payment_type] || 'Sin configurar'}
                        </span>
                      </td>
                      <td className="p-3 text-right text-sm">
                        {emp.payment_type === 'per_wash' && emp.amount_per_wash ? formatCurrency(emp.amount_per_wash) + ' / lavado' : ''}
                        {emp.payment_type === 'percentage' && emp.percentage_rate ? emp.percentage_rate + '% / servicio' : ''}
                        {emp.payment_type === 'fixed_salary' && emp.base_salary ? formatCurrency(emp.base_salary) : ''}
                        {!emp.payment_type && emp.base_salary ? formatCurrency(emp.base_salary) : ''}
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => openEditPaymentConfig(emp)} className="p-1 hover:bg-slate-100 rounded" title="Editar">
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* === PAYMENT CONFIG MODAL === */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Configurar Pago - {editModal.full_name}</h3>
              <button onClick={() => setEditModal(null)} className="p-1 hover:bg-slate-100 rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSavePaymentConfig} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Pago</label>
                <select value={editForm.payment_type}
                  onChange={e => setEditForm({ ...editForm, payment_type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2">
                  <option value="fixed_salary">Salario Fijo</option>
                  <option value="per_wash">Por Lavado</option>
                  <option value="percentage">Porcentaje</option>
                </select>
              </div>

              {editForm.payment_type === 'per_wash' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Monto por Lavado</label>
                  <input type="number" min="0" step="100" value={editForm.amount_per_wash}
                    onChange={e => setEditForm({ ...editForm, amount_per_wash: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2" required />
                </div>
              )}

              {editForm.payment_type === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Porcentaje por Servicio (%)</label>
                  <input type="number" min="0" max="100" step="0.5" value={editForm.percentage_rate}
                    onChange={e => setEditForm({ ...editForm, percentage_rate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2" required />
                </div>
              )}

              {editForm.payment_type === 'fixed_salary' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Salario Base</label>
                  <input type="number" min="0" step="1000" value={editForm.base_salary}
                    onChange={e => setEditForm({ ...editForm, base_salary: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2" required />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditModal(null)} className="flex-1 border rounded-lg py-2">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 bg-primary text-white rounded-lg py-2 disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!approveConfirm}
        title="Aprobar Nomina"
        message="Al aprobar la nomina se marcara como pagada. Desea continuar?"
        confirmText="Aprobar"
        variant="default"
        onConfirm={handleApprove}
        onCancel={() => setApproveConfirm(null)}
      />
    </div>
  );
}
