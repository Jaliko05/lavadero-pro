import { useState, useEffect, useCallback } from 'react';
import {
  getSalesReport,
  getVehiclesReport,
  getAttendanceReport,
  getPerformanceReport,
  getPayrollReport,
  getClientsReport,
  getInventoryReport,
  exportCSV,
} from '@/api/reports';
import { listEmployees } from '@/api/employees';
import { listCategories } from '@/api/vehicle-categories';
import DateRangePicker from '@/components/shared/DateRangePicker';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { FileText, Download, Filter, Calendar, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

const REPORT_TYPES = [
  { id: 'sales', label: 'Ventas', fn: getSalesReport },
  { id: 'vehicles', label: 'Vehiculos', fn: getVehiclesReport },
  { id: 'attendance', label: 'Asistencia', fn: getAttendanceReport },
  { id: 'performance', label: 'Rendimiento', fn: getPerformanceReport },
  { id: 'payroll', label: 'Nomina', fn: getPayrollReport },
  { id: 'clients', label: 'Clientes', fn: getClientsReport },
  { id: 'inventory', label: 'Inventario', fn: getInventoryReport },
];

const EMPLOYEE_REPORTS = ['attendance', 'performance', 'payroll'];
const CATEGORY_REPORTS = ['vehicles'];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function monthAgoStr() {
  return new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
}

export default function Reports() {
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState({ from: monthAgoStr(), to: todayStr() });
  const [employeeId, setEmployeeId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    listEmployees()
      .then((res) => setEmployees(res.data?.data || res.data || []))
      .catch(() => {});
    listCategories()
      .then((res) => setCategories(res.data?.data || res.data || []))
      .catch(() => {});
  }, []);

  const selectedReport = REPORT_TYPES.find((r) => r.id === reportType);
  const showEmployeeFilter = EMPLOYEE_REPORTS.includes(reportType);
  const showCategoryFilter = CATEGORY_REPORTS.includes(reportType);

  const loadReport = useCallback(async () => {
    if (!selectedReport) return;
    setLoading(true);
    setData(null);
    try {
      const params = { from: dateRange.from, to: dateRange.to };
      if (showEmployeeFilter && employeeId) params.employee_id = employeeId;
      if (showCategoryFilter && categoryId) params.category_id = categoryId;
      const res = await selectedReport.fn(params);
      setData(res.data?.data || res.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  }, [selectedReport, dateRange, employeeId, categoryId, showEmployeeFilter, showCategoryFilter]);

  useEffect(() => {
    if (reportType) loadReport();
  }, [reportType]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleExportCSV() {
    if (!reportType) return;
    setExporting(true);
    try {
      const params = { from: dateRange.from, to: dateRange.to };
      if (showEmployeeFilter && employeeId) params.employee_id = employeeId;
      if (showCategoryFilter && categoryId) params.category_id = categoryId;
      const response = await exportCSV(reportType, params);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${reportType}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Reporte exportado correctamente');
    } catch (e) {
      console.error(e);
      toast.error('Error al exportar el reporte');
    } finally {
      setExporting(false);
    }
  }

  function handleReportTypeChange(e) {
    setReportType(e.target.value);
    setData(null);
    setEmployeeId('');
    setCategoryId('');
  }

  const rows = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reportes</h1>
        {reportType && rows.length > 0 && (
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
        )}
      </div>

      {/* Filters bar */}
      <div className="bg-slate-100 rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Report type selector */}
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <FileText className="w-3.5 h-3.5 inline mr-1" />
              Tipo de reporte
            </label>
            <select
              value={reportType}
              onChange={handleReportTypeChange}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Seleccionar reporte...</option>
              {REPORT_TYPES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              Rango de fechas
            </label>
            <DateRangePicker from={dateRange.from} to={dateRange.to} onChange={setDateRange} />
          </div>
        </div>

        {/* Conditional filters */}
        {(showEmployeeFilter || showCategoryFilter) && (
          <div className="flex flex-wrap items-end gap-4 pt-2 border-t border-slate-200">
            <Filter className="w-4 h-4 text-slate-400" />
            {showEmployeeFilter && (
              <div className="min-w-[200px]">
                <label className="block text-sm font-medium text-slate-700 mb-1">Empleado</label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Todos los empleados</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {showCategoryFilter && (
              <div className="min-w-[200px]">
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Todas las categorias</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Generate button */}
        {reportType && (
          <div className="flex justify-end">
            <button
              onClick={loadReport}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
            >
              {loading ? 'Generando...' : 'Generar reporte'}
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      {/* No report selected */}
      {!reportType && !loading && (
        <div className="bg-white rounded-lg border">
          <EmptyState
            icon={BarChart3}
            title="Selecciona un tipo de reporte"
            description="Elige un reporte del selector superior para generar los datos"
          />
        </div>
      )}

      {/* No data */}
      {!loading && reportType && data !== null && rows.length === 0 && (
        <div className="bg-white rounded-lg border">
          <EmptyState
            icon={FileText}
            title="Sin datos"
            description="No se encontraron datos para el rango de fechas seleccionado"
          />
        </div>
      )}

      {/* Report tables */}
      {!loading && rows.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-lg">Reporte de {selectedReport?.label}</h2>
            <span className="text-sm text-slate-500">{rows.length} registros</span>
          </div>
          <div className="overflow-x-auto">
            {reportType === 'sales' && <SalesTable rows={rows} />}
            {reportType === 'vehicles' && <VehiclesTable rows={rows} />}
            {reportType === 'attendance' && <AttendanceTable rows={rows} />}
            {reportType === 'performance' && <PerformanceTable rows={rows} />}
            {reportType === 'payroll' && <PayrollTable rows={rows} />}
            {reportType === 'clients' && <ClientsTable rows={rows} />}
            {reportType === 'inventory' && <InventoryTable rows={rows} />}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Table Components ─── */

function SalesTable({ rows }) {
  const total = rows.reduce((s, r) => s + (Number(r.total) || 0), 0);

  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-left">
        <tr>
          <th className="px-4 py-3 font-medium text-slate-600">Fecha</th>
          <th className="px-4 py-3 font-medium text-slate-600">Cliente</th>
          <th className="px-4 py-3 font-medium text-slate-600">Items</th>
          <th className="px-4 py-3 font-medium text-slate-600">Metodo de pago</th>
          <th className="px-4 py-3 font-medium text-slate-600 text-right">Total</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.map((r, i) => (
          <tr key={i} className="hover:bg-slate-50">
            <td className="px-4 py-3">{formatDate(r.fecha || r.date || r.created_at)}</td>
            <td className="px-4 py-3">{r.cliente || r.customer_name || '-'}</td>
            <td className="px-4 py-3">{r.items || r.item_count || '-'}</td>
            <td className="px-4 py-3">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                {r.metodo_pago || r.payment_method || '-'}
              </span>
            </td>
            <td className="px-4 py-3 text-right font-medium">{formatCurrency(r.total || 0)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot className="bg-slate-50 font-semibold">
        <tr>
          <td className="px-4 py-3" colSpan={4}>
            Total
          </td>
          <td className="px-4 py-3 text-right">{formatCurrency(total)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

function VehiclesTable({ rows }) {
  const totalWashes = rows.reduce((s, r) => s + (Number(r.total_lavados || r.total_washes) || 0), 0);

  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-left">
        <tr>
          <th className="px-4 py-3 font-medium text-slate-600">Placa</th>
          <th className="px-4 py-3 font-medium text-slate-600">Marca</th>
          <th className="px-4 py-3 font-medium text-slate-600">Modelo</th>
          <th className="px-4 py-3 font-medium text-slate-600">Categoria</th>
          <th className="px-4 py-3 font-medium text-slate-600 text-right">Total lavados</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.map((r, i) => (
          <tr key={i} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-mono">{r.placa || r.plate || '-'}</td>
            <td className="px-4 py-3">{r.marca || r.brand || '-'}</td>
            <td className="px-4 py-3">{r.modelo || r.model || '-'}</td>
            <td className="px-4 py-3">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                {r.categoria || r.category_name || '-'}
              </span>
            </td>
            <td className="px-4 py-3 text-right font-medium">{r.total_lavados || r.total_washes || 0}</td>
          </tr>
        ))}
      </tbody>
      <tfoot className="bg-slate-50 font-semibold">
        <tr>
          <td className="px-4 py-3" colSpan={4}>
            Total lavados
          </td>
          <td className="px-4 py-3 text-right">{totalWashes}</td>
        </tr>
      </tfoot>
    </table>
  );
}

function AttendanceTable({ rows }) {
  const totalHours = rows.reduce((s, r) => s + (Number(r.horas || r.hours) || 0), 0);

  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-left">
        <tr>
          <th className="px-4 py-3 font-medium text-slate-600">Empleado</th>
          <th className="px-4 py-3 font-medium text-slate-600">Fecha</th>
          <th className="px-4 py-3 font-medium text-slate-600">Entrada</th>
          <th className="px-4 py-3 font-medium text-slate-600">Salida</th>
          <th className="px-4 py-3 font-medium text-slate-600 text-right">Horas</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.map((r, i) => (
          <tr key={i} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium">{r.empleado || r.employee_name || '-'}</td>
            <td className="px-4 py-3">{formatDate(r.fecha || r.date)}</td>
            <td className="px-4 py-3">{formatTime(r.entrada || r.check_in) || '-'}</td>
            <td className="px-4 py-3">{formatTime(r.salida || r.check_out) || '-'}</td>
            <td className="px-4 py-3 text-right font-medium">
              {(r.horas || r.hours || 0).toFixed?.(1) || r.horas || r.hours || 0}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot className="bg-slate-50 font-semibold">
        <tr>
          <td className="px-4 py-3" colSpan={4}>
            Total horas
          </td>
          <td className="px-4 py-3 text-right">{totalHours.toFixed(1)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

function PerformanceTable({ rows }) {
  const totalTurns = rows.reduce((s, r) => s + (Number(r.turnos_completados || r.completed_turns) || 0), 0);

  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-left">
        <tr>
          <th className="px-4 py-3 font-medium text-slate-600">Empleado</th>
          <th className="px-4 py-3 font-medium text-slate-600 text-right">Turnos completados</th>
          <th className="px-4 py-3 font-medium text-slate-600 text-right">Tiempo promedio</th>
          <th className="px-4 py-3 font-medium text-slate-600 text-right">Calificacion</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.map((r, i) => (
          <tr key={i} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium">{r.empleado || r.employee_name || '-'}</td>
            <td className="px-4 py-3 text-right">{r.turnos_completados || r.completed_turns || 0}</td>
            <td className="px-4 py-3 text-right">{r.tiempo_promedio || r.avg_time || '-'} min</td>
            <td className="px-4 py-3 text-right">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  (r.calificacion || r.rating || 0) >= 4
                    ? 'bg-green-50 text-green-700'
                    : (r.calificacion || r.rating || 0) >= 3
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-red-50 text-red-700'
                }`}
              >
                {(r.calificacion || r.rating || 0).toFixed?.(1) || r.calificacion || r.rating || 0}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot className="bg-slate-50 font-semibold">
        <tr>
          <td className="px-4 py-3">Total</td>
          <td className="px-4 py-3 text-right">{totalTurns}</td>
          <td className="px-4 py-3" colSpan={2} />
        </tr>
      </tfoot>
    </table>
  );
}

function PayrollTable({ rows }) {
  const totalNet = rows.reduce((s, r) => s + (Number(r.neto || r.net_pay) || 0), 0);

  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-left">
        <tr>
          <th className="px-4 py-3 font-medium text-slate-600">Empleado</th>
          <th className="px-4 py-3 font-medium text-slate-600 text-right">Salario base</th>
          <th className="px-4 py-3 font-medium text-slate-600 text-right">Comisiones</th>
          <th className="px-4 py-3 font-medium text-slate-600 text-right">Deducciones</th>
          <th className="px-4 py-3 font-medium text-slate-600 text-right">Neto</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.map((r, i) => (
          <tr key={i} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium">{r.empleado || r.employee_name || '-'}</td>
            <td className="px-4 py-3 text-right">{formatCurrency(r.salario_base || r.base_salary || 0)}</td>
            <td className="px-4 py-3 text-right text-green-600">
              +{formatCurrency(r.comisiones || r.commissions || 0)}
            </td>
            <td className="px-4 py-3 text-right text-red-600">
              -{formatCurrency(r.deducciones || r.deductions || 0)}
            </td>
            <td className="px-4 py-3 text-right font-semibold">{formatCurrency(r.neto || r.net_pay || 0)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot className="bg-slate-50 font-semibold">
        <tr>
          <td className="px-4 py-3" colSpan={4}>
            Total neto
          </td>
          <td className="px-4 py-3 text-right">{formatCurrency(totalNet)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

function ClientsTable({ rows }) {
  const totalSpent = rows.reduce((s, r) => s + (Number(r.total_gastado || r.total_spent) || 0), 0);

  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-left">
        <tr>
          <th className="px-4 py-3 font-medium text-slate-600">Nombre</th>
          <th className="px-4 py-3 font-medium text-slate-600">Telefono</th>
          <th className="px-4 py-3 font-medium text-slate-600 text-right">Total visitas</th>
          <th className="px-4 py-3 font-medium text-slate-600 text-right">Total gastado</th>
          <th className="px-4 py-3 font-medium text-slate-600 text-right">Puntos</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.map((r, i) => (
          <tr key={i} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium">{r.nombre || r.name || '-'}</td>
            <td className="px-4 py-3">{r.telefono || r.phone || '-'}</td>
            <td className="px-4 py-3 text-right">{r.total_visitas || r.total_visits || 0}</td>
            <td className="px-4 py-3 text-right">{formatCurrency(r.total_gastado || r.total_spent || 0)}</td>
            <td className="px-4 py-3 text-right">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                {r.puntos || r.points || 0}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot className="bg-slate-50 font-semibold">
        <tr>
          <td className="px-4 py-3" colSpan={3}>
            Total gastado
          </td>
          <td className="px-4 py-3 text-right">{formatCurrency(totalSpent)}</td>
          <td className="px-4 py-3" />
        </tr>
      </tfoot>
    </table>
  );
}

function InventoryTable({ rows }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-left">
        <tr>
          <th className="px-4 py-3 font-medium text-slate-600">Item</th>
          <th className="px-4 py-3 font-medium text-slate-600">Tipo</th>
          <th className="px-4 py-3 font-medium text-slate-600 text-right">Stock actual</th>
          <th className="px-4 py-3 font-medium text-slate-600 text-right">Stock minimo</th>
          <th className="px-4 py-3 font-medium text-slate-600 text-right">Movimientos</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.map((r, i) => {
          const stock = Number(r.stock_actual || r.current_stock) || 0;
          const minStock = Number(r.min_stock || r.minimum_stock) || 0;
          const lowStock = stock <= minStock && minStock > 0;

          return (
            <tr key={i} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium">{r.item || r.name || '-'}</td>
              <td className="px-4 py-3">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  {r.tipo || r.type || '-'}
                </span>
              </td>
              <td className={`px-4 py-3 text-right font-medium ${lowStock ? 'text-red-600' : ''}`}>{stock}</td>
              <td className="px-4 py-3 text-right">{minStock}</td>
              <td className="px-4 py-3 text-right">{r.movimientos || r.movements || 0}</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot className="bg-slate-50 font-semibold">
        <tr>
          <td className="px-4 py-3" colSpan={4}>
            Total items
          </td>
          <td className="px-4 py-3 text-right">{rows.length}</td>
        </tr>
      </tfoot>
    </table>
  );
}
