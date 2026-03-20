import { useState, useEffect } from 'react';
import { generatePayroll, listPayroll, getPayroll, approvePayroll } from '@/api/payroll';
import { listEmployees } from '@/api/employees';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DollarSign, Users, CheckCircle, Calendar, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import EmptyState from '@/components/shared/EmptyState';

export default function Payroll() {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedItems, setExpandedItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Generate modal
  const [showGenerate, setShowGenerate] = useState(false);
  const [genForm, setGenForm] = useState({
    period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    period_end: new Date().toISOString().slice(0, 10),
  });

  // Approve confirm
  const [approveConfirm, setApproveConfirm] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [pr, emp] = await Promise.allSettled([listPayroll(), listEmployees()]);
      if (pr.status === 'fulfilled') setPayrolls(pr.value.data || []);
      if (emp.status === 'fulfilled') setEmployees(emp.value.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setGenerating(true);
    try {
      await generatePayroll(genForm);
      toast.success('Nomina generada exitosamente');
      setShowGenerate(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al generar nomina');
    } finally { setGenerating(false); }
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

  function getEmployeeName(id) {
    return employees.find(e => e.id === id)?.full_name || `ID ${id}`;
  }

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const totalPending = payrolls.filter(p => p.status === 'pendiente' || p.status === 'draft').length;
  const totalApproved = payrolls.filter(p => p.status === 'aprobada' || p.status === 'approved').length;
  const grandTotal = payrolls.reduce((sum, p) => sum + (p.total_net || p.total || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nomina</h1>
        <button onClick={() => setShowGenerate(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
          <FileText className="h-4 w-4" /> Generar Nomina
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg"><FileText className="h-5 w-5 text-blue-600" /></div>
          <div><p className="text-sm text-slate-500">Total Nominas</p><p className="text-2xl font-bold">{payrolls.length}</p></div>
        </div>
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg"><Calendar className="h-5 w-5 text-yellow-600" /></div>
          <div><p className="text-sm text-slate-500">Pendientes</p><p className="text-2xl font-bold text-yellow-600">{totalPending}</p></div>
        </div>
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
          <div><p className="text-sm text-slate-500">Aprobadas</p><p className="text-2xl font-bold text-green-600">{totalApproved}</p></div>
        </div>
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg"><DollarSign className="h-5 w-5 text-purple-600" /></div>
          <div><p className="text-sm text-slate-500">Total Pagado</p><p className="text-2xl font-bold">{formatCurrency(grandTotal)}</p></div>
        </div>
      </div>

      {/* Payroll list */}
      {payrolls.length === 0 ? (
        <EmptyState icon={FileText} title="Sin nominas" description="Genera la primera nomina del periodo" />
      ) : (
        <div className="space-y-3">
          {payrolls.map(pr => {
            const isExpanded = expandedId === pr.id;
            const isPending = pr.status === 'pendiente' || pr.status === 'draft';
            return (
              <div key={pr.id} className="bg-white rounded-lg border">
                <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50" onClick={() => toggleExpand(pr.id)}>
                  <div className="flex items-center gap-4">
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    <div>
                      <p className="font-semibold">Periodo: {formatDate(pr.period_start)} - {formatDate(pr.period_end)}</p>
                      <p className="text-sm text-slate-500">{pr.employee_count || expandedItems.length} empleados</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${isPending ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {isPending ? 'Pendiente' : 'Aprobada'}
                    </span>
                    <span className="font-bold text-lg">{formatCurrency(pr.total_net || pr.total || 0)}</span>
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
                          <th className="p-3 text-right">Salario Base</th>
                          <th className="p-3 text-right">Comisiones</th>
                          <th className="p-3 text-right">Deducciones</th>
                          <th className="p-3 text-right">Dias</th>
                          <th className="p-3 text-right font-semibold">Neto</th>
                        </tr></thead>
                        <tbody>
                          {expandedItems.map((item, idx) => (
                            <tr key={item.id || idx} className="border-b hover:bg-slate-50">
                              <td className="p-3 font-medium">{item.employee_name || getEmployeeName(item.employee_id)}</td>
                              <td className="p-3 text-right">{formatCurrency(item.base_salary || 0)}</td>
                              <td className="p-3 text-right text-green-600">{formatCurrency(item.commissions || 0)}</td>
                              <td className="p-3 text-right text-red-600">{formatCurrency(item.deductions || 0)}</td>
                              <td className="p-3 text-right">{item.days_worked || '-'}</td>
                              <td className="p-3 text-right font-bold">{formatCurrency(item.net_pay || item.total || 0)}</td>
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

      {/* Generate Modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowGenerate(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Generar Nomina</h3>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fecha Inicio</label>
                <input type="date" value={genForm.period_start} onChange={e => setGenForm({ ...genForm, period_start: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha Fin</label>
                <input type="date" value={genForm.period_end} onChange={e => setGenForm({ ...genForm, period_end: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2" required />
              </div>
              <p className="text-sm text-slate-500">Se generara la nomina para todos los empleados activos en el periodo seleccionado.</p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowGenerate(false)} className="flex-1 border rounded-lg py-2">Cancelar</button>
                <button type="submit" disabled={generating} className="flex-1 bg-primary text-white rounded-lg py-2 disabled:opacity-50">
                  {generating ? 'Generando...' : 'Generar'}
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
