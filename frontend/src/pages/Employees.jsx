import { useState, useEffect } from 'react';
import {
  listEmployees, createEmployee, updateEmployee, deleteEmployee,
  getEmployeeAttendance,
  listSchedules, createSchedule, updateSchedule, deleteSchedule,
  listCommissions, createCommission, updateCommission, deleteCommission,
} from '@/api/employees';
import { listServices } from '@/api/services';
import { Users, Plus, Edit2, Trash2, Clock, Calendar, DollarSign, Search } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import EmptyState from '@/components/shared/EmptyState';

const EMPTY_EMPLOYEE = {
  full_name: '', document_type: 'CC', document_number: '', phone: '', address: '',
  role: 'lavador', base_salary: 0, contract_type: 'fijo', hire_date: '',
  bank_name: '', bank_account: '', eps: '', afp: '', status: 'activo',
};

const EMPTY_SCHEDULE = { employee_id: '', day_of_week: 'lunes', start_time: '08:00', end_time: '17:00' };
const EMPTY_COMMISSION = { employee_id: '', wash_service_id: '', percentage: 0, fixed_amount: 0 };

const ROLES = ['lavador', 'recepcionista', 'cajero', 'administrador'];
const CONTRACT_TYPES = ['fijo', 'medio_tiempo', 'prestacion_servicios'];
const DAYS_OF_WEEK = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DOC_TYPES = ['CC', 'CE', 'TI', 'NIT', 'PP'];

export default function Employees() {
  const [activeTab, setActiveTab] = useState('empleados');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Employee modal
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_EMPLOYEE);

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Attendance
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Schedules
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(null);
  const [scheduleForm, setScheduleForm] = useState(EMPTY_SCHEDULE);
  const [confirmDeleteSchedule, setConfirmDeleteSchedule] = useState(null);

  // Commissions
  const [commissions, setCommissions] = useState([]);
  const [loadingCommissions, setLoadingCommissions] = useState(false);
  const [commissionModal, setCommissionModal] = useState(null);
  const [commissionForm, setCommissionForm] = useState(EMPTY_COMMISSION);
  const [confirmDeleteCommission, setConfirmDeleteCommission] = useState(null);
  const [washServices, setWashServices] = useState([]);

  useEffect(() => { loadEmployees(); }, []);

  useEffect(() => {
    if (activeTab === 'asistencia' && selectedEmployeeId) loadAttendance(selectedEmployeeId);
    if (activeTab === 'horarios') loadSchedules();
    if (activeTab === 'comisiones') { loadCommissions(); loadWashServices(); }
  }, [activeTab]);

  // --- Employees ---
  async function loadEmployees() {
    try { const res = await listEmployees(); setEmployees(Array.isArray(res.data) ? res.data : []); }
    catch { console.error('Error loading employees'); }
    finally { setLoading(false); }
  }

  function openCreate() { setForm(EMPTY_EMPLOYEE); setModal('create'); }
  function openEdit(emp) { setForm({ ...emp, hire_date: emp.hire_date ? emp.hire_date.substring(0, 10) : '' }); setModal('edit'); }

  async function handleSave(e) {
    e.preventDefault();
    try {
      const payload = { ...form, base_salary: Number(form.base_salary) };
      if (modal === 'create') await createEmployee(payload);
      else await updateEmployee(form.id, payload);
      toast.success(modal === 'create' ? 'Empleado creado exitosamente' : 'Empleado actualizado');
      setModal(null);
      loadEmployees();
    } catch { toast.error('Error al guardar empleado'); }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await deleteEmployee(confirmDelete);
      toast.success('Empleado eliminado');
      setConfirmDelete(null);
      loadEmployees();
    } catch { toast.error('Error al eliminar empleado'); }
  }

  // --- Attendance ---
  async function loadAttendance(empId) {
    setLoadingAttendance(true);
    try {
      const res = await getEmployeeAttendance(empId);
      setAttendance(Array.isArray(res.data) ? res.data : []);
    } catch { toast.error('Error cargando asistencia'); setAttendance([]); }
    finally { setLoadingAttendance(false); }
  }

  function handleSelectEmployeeAttendance(empId) {
    setSelectedEmployeeId(empId);
    if (empId) loadAttendance(empId);
    else setAttendance([]);
  }

  // --- Schedules ---
  async function loadSchedules() {
    setLoadingSchedules(true);
    try { const res = await listSchedules(); setSchedules(Array.isArray(res.data) ? res.data : []); }
    catch { toast.error('Error cargando horarios'); }
    finally { setLoadingSchedules(false); }
  }

  function openCreateSchedule() { setScheduleForm(EMPTY_SCHEDULE); setScheduleModal('create'); }
  function openEditSchedule(s) { setScheduleForm({ ...s }); setScheduleModal('edit'); }

  async function handleSaveSchedule(e) {
    e.preventDefault();
    try {
      const payload = { ...scheduleForm, employee_id: Number(scheduleForm.employee_id) };
      if (scheduleModal === 'create') await createSchedule(payload);
      else await updateSchedule(scheduleForm.id, payload);
      toast.success(scheduleModal === 'create' ? 'Horario creado' : 'Horario actualizado');
      setScheduleModal(null);
      loadSchedules();
    } catch { toast.error('Error al guardar horario'); }
  }

  async function handleDeleteSchedule() {
    if (!confirmDeleteSchedule) return;
    try {
      await deleteSchedule(confirmDeleteSchedule);
      toast.success('Horario eliminado');
      setConfirmDeleteSchedule(null);
      loadSchedules();
    } catch { toast.error('Error al eliminar horario'); }
  }

  // --- Commissions ---
  async function loadCommissions() {
    setLoadingCommissions(true);
    try { const res = await listCommissions(); setCommissions(Array.isArray(res.data) ? res.data : []); }
    catch { toast.error('Error cargando comisiones'); }
    finally { setLoadingCommissions(false); }
  }

  async function loadWashServices() {
    try { const res = await listServices(); setWashServices(Array.isArray(res.data) ? res.data : []); }
    catch { console.error('Error loading wash services'); }
  }

  function openCreateCommission() { setCommissionForm(EMPTY_COMMISSION); setCommissionModal('create'); }
  function openEditCommission(c) { setCommissionForm({ ...c }); setCommissionModal('edit'); }

  async function handleSaveCommission(e) {
    e.preventDefault();
    try {
      const payload = {
        ...commissionForm,
        employee_id: Number(commissionForm.employee_id),
        wash_service_id: Number(commissionForm.wash_service_id),
        percentage: Number(commissionForm.percentage),
        fixed_amount: Number(commissionForm.fixed_amount),
      };
      if (commissionModal === 'create') await createCommission(payload);
      else await updateCommission(commissionForm.id, payload);
      toast.success(commissionModal === 'create' ? 'Comision creada' : 'Comision actualizada');
      setCommissionModal(null);
      loadCommissions();
    } catch { toast.error('Error al guardar comision'); }
  }

  async function handleDeleteCommission() {
    if (!confirmDeleteCommission) return;
    try {
      await deleteCommission(confirmDeleteCommission);
      toast.success('Comision eliminada');
      setConfirmDeleteCommission(null);
      loadCommissions();
    } catch { toast.error('Error al eliminar comision'); }
  }

  // --- Helpers ---
  function getEmployeeName(id) {
    const emp = employees.find(e => e.id === id || e.id === Number(id));
    return emp ? emp.full_name : `ID ${id}`;
  }

  function getServiceName(id) {
    const svc = washServices.find(s => s.id === id || s.id === Number(id));
    return svc ? svc.name : `ID ${id}`;
  }

  const filteredEmployees = employees.filter(emp =>
    emp.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    emp.document_number?.includes(search) ||
    emp.role?.toLowerCase().includes(search.toLowerCase())
  );

  const TABS = [
    { key: 'empleados', label: 'Empleados', icon: Users },
    { key: 'asistencia', label: 'Asistencia', icon: Calendar },
    { key: 'horarios', label: 'Horarios', icon: Clock },
    { key: 'comisiones', label: 'Comisiones', icon: DollarSign },
  ];

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Personal</h1>
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

      {/* Summary cards */}
      {activeTab === 'empleados' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4 text-center">
            <p className="text-3xl font-bold">{employees.length}</p>
            <p className="text-sm text-slate-500">Total Empleados</p>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{employees.filter(e => e.status === 'activo').length}</p>
            <p className="text-sm text-slate-500">Activos</p>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <p className="text-3xl font-bold text-red-500">{employees.filter(e => e.status === 'inactivo').length}</p>
            <p className="text-sm text-slate-500">Inactivos</p>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{employees.filter(e => e.role === 'lavador').length}</p>
            <p className="text-sm text-slate-500">Lavadores</p>
          </div>
        </div>
      )}

      {/* === EMPLEADOS TAB === */}
      {activeTab === 'empleados' && (
        <>
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, documento o rol..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm"
              />
            </div>
            <button onClick={openCreate} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nuevo Empleado
            </button>
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="bg-white rounded-lg border">
              <EmptyState icon={Users} title="Sin empleados" description="No hay empleados registrados" />
            </div>
          ) : (
            <div className="bg-white rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-slate-500">
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Documento</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Telefono</th>
                    <th className="p-3">Salario Base</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(emp => (
                    <tr key={emp.id} className="border-b hover:bg-slate-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="font-medium">{emp.full_name}</p>
                            <p className="text-xs text-slate-500">{emp.contract_type || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm">{emp.document_type} {emp.document_number}</td>
                      <td className="p-3">
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 capitalize">{emp.role}</span>
                      </td>
                      <td className="p-3 text-sm">{emp.phone || '-'}</td>
                      <td className="p-3 text-sm">{formatCurrency(emp.base_salary || 0)}</td>
                      <td className="p-3">
                        <span className={cn(
                          'text-xs px-2 py-1 rounded font-medium',
                          emp.status === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        )}>
                          {emp.status || 'activo'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => openEdit(emp)} className="p-1 hover:bg-slate-100 rounded" title="Editar">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => setConfirmDelete(emp.id)} className="p-1 hover:bg-red-50 rounded text-red-500 ml-1" title="Eliminar">
                          <Trash2 className="h-4 w-4" />
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

      {/* === ASISTENCIA TAB === */}
      {activeTab === 'asistencia' && (
        <>
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-sm">
              <label className="block text-sm font-medium mb-1">Seleccionar Empleado</label>
              <select
                value={selectedEmployeeId}
                onChange={e => handleSelectEmployeeAttendance(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">-- Seleccione --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          {!selectedEmployeeId ? (
            <div className="bg-white rounded-lg border">
              <EmptyState icon={Calendar} title="Seleccione un empleado" description="Elija un empleado para ver su asistencia" />
            </div>
          ) : loadingAttendance ? (
            <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : attendance.length === 0 ? (
            <div className="bg-white rounded-lg border">
              <EmptyState icon={Calendar} title="Sin registros" description="No hay registros de asistencia para este empleado" />
            </div>
          ) : (
            <div className="bg-white rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-slate-500">
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Entrada</th>
                    <th className="p-3">Salida</th>
                    <th className="p-3">Horas</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((att, idx) => (
                    <tr key={att.id || idx} className="border-b hover:bg-slate-50">
                      <td className="p-3 text-sm">{formatDate(att.date || att.check_in)}</td>
                      <td className="p-3 text-sm">{att.check_in ? new Date(att.check_in).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                      <td className="p-3 text-sm">{att.check_out ? new Date(att.check_out).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                      <td className="p-3 text-sm">{att.hours_worked != null ? `${att.hours_worked}h` : '-'}</td>
                      <td className="p-3">
                        <span className={cn(
                          'text-xs px-2 py-1 rounded font-medium',
                          att.status === 'presente' ? 'bg-green-100 text-green-700' :
                          att.status === 'ausente' ? 'bg-red-100 text-red-700' :
                          att.status === 'tardanza' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-slate-100 text-slate-600'
                        )}>
                          {att.status || '-'}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-slate-500">{att.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* === HORARIOS TAB === */}
      {activeTab === 'horarios' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Gestione los horarios de trabajo de cada empleado</p>
            <button onClick={openCreateSchedule} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nuevo Horario
            </button>
          </div>

          {loadingSchedules ? (
            <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : schedules.length === 0 ? (
            <div className="bg-white rounded-lg border">
              <EmptyState icon={Clock} title="Sin horarios" description="No hay horarios configurados" />
            </div>
          ) : (
            <div className="bg-white rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-slate-500">
                    <th className="p-3">Empleado</th>
                    <th className="p-3">Dia</th>
                    <th className="p-3">Hora Inicio</th>
                    <th className="p-3">Hora Fin</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map(s => (
                    <tr key={s.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 text-sm font-medium">{getEmployeeName(s.employee_id)}</td>
                      <td className="p-3 text-sm capitalize">{s.day_of_week}</td>
                      <td className="p-3 text-sm">{s.start_time}</td>
                      <td className="p-3 text-sm">{s.end_time}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => openEditSchedule(s)} className="p-1 hover:bg-slate-100 rounded"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => setConfirmDeleteSchedule(s.id)} className="p-1 hover:bg-red-50 rounded text-red-500 ml-1"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* === COMISIONES TAB === */}
      {activeTab === 'comisiones' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Configure las comisiones por servicio de lavado</p>
            <button onClick={openCreateCommission} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nueva Comision
            </button>
          </div>

          {loadingCommissions ? (
            <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : commissions.length === 0 ? (
            <div className="bg-white rounded-lg border">
              <EmptyState icon={DollarSign} title="Sin comisiones" description="No hay comisiones configuradas" />
            </div>
          ) : (
            <div className="bg-white rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-slate-500">
                    <th className="p-3">Empleado</th>
                    <th className="p-3">Servicio</th>
                    <th className="p-3">Porcentaje</th>
                    <th className="p-3">Monto Fijo</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map(c => (
                    <tr key={c.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 text-sm font-medium">{getEmployeeName(c.employee_id)}</td>
                      <td className="p-3 text-sm">{getServiceName(c.wash_service_id)}</td>
                      <td className="p-3 text-sm">{c.percentage ? `${c.percentage}%` : '-'}</td>
                      <td className="p-3 text-sm">{c.fixed_amount ? formatCurrency(c.fixed_amount) : '-'}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => openEditCommission(c)} className="p-1 hover:bg-slate-100 rounded"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => setConfirmDeleteCommission(c.id)} className="p-1 hover:bg-red-50 rounded text-red-500 ml-1"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* === EMPLOYEE MODAL === */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{modal === 'create' ? 'Nuevo Empleado' : 'Editar Empleado'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                  <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo Documento</label>
                  <select value={form.document_type || 'CC'} onChange={e => setForm({ ...form, document_type: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    {DOC_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Numero de Documento</label>
                  <input value={form.document_number || ''} onChange={e => setForm({ ...form, document_number: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefono</label>
                  <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rol</label>
                  <select value={form.role || 'lavador'} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Direccion</label>
                  <input value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Salario Base</label>
                  <input type="number" min="0" value={form.base_salary || ''} onChange={e => setForm({ ...form, base_salary: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Contrato</label>
                  <select value={form.contract_type || 'fijo'} onChange={e => setForm({ ...form, contract_type: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    {CONTRACT_TYPES.map(ct => <option key={ct} value={ct}>{ct.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha de Contratacion</label>
                  <input type="date" value={form.hire_date || ''} onChange={e => setForm({ ...form, hire_date: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Banco</label>
                  <input value={form.bank_name || ''} onChange={e => setForm({ ...form, bank_name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cuenta Bancaria</label>
                  <input value={form.bank_account || ''} onChange={e => setForm({ ...form, bank_account: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">EPS</label>
                  <input value={form.eps || ''} onChange={e => setForm({ ...form, eps: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">AFP</label>
                  <input value={form.afp || ''} onChange={e => setForm({ ...form, afp: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                {modal === 'edit' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Estado</label>
                    <select value={form.status || 'activo'} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 border rounded-lg py-2">Cancelar</button>
                <button type="submit" className="flex-1 bg-primary text-white rounded-lg py-2">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === SCHEDULE MODAL === */}
      {scheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setScheduleModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{scheduleModal === 'create' ? 'Nuevo Horario' : 'Editar Horario'}</h3>
            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Empleado</label>
                  <select value={scheduleForm.employee_id || ''} onChange={e => setScheduleForm({ ...scheduleForm, employee_id: e.target.value })} className="w-full border rounded-lg px-3 py-2" required>
                    <option value="">-- Seleccione --</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Dia de la Semana</label>
                  <select value={scheduleForm.day_of_week || 'lunes'} onChange={e => setScheduleForm({ ...scheduleForm, day_of_week: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    {DAYS_OF_WEEK.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hora Inicio</label>
                  <input type="time" value={scheduleForm.start_time || '08:00'} onChange={e => setScheduleForm({ ...scheduleForm, start_time: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hora Fin</label>
                  <input type="time" value={scheduleForm.end_time || '17:00'} onChange={e => setScheduleForm({ ...scheduleForm, end_time: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setScheduleModal(null)} className="flex-1 border rounded-lg py-2">Cancelar</button>
                <button type="submit" className="flex-1 bg-primary text-white rounded-lg py-2">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === COMMISSION MODAL === */}
      {commissionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setCommissionModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{commissionModal === 'create' ? 'Nueva Comision' : 'Editar Comision'}</h3>
            <form onSubmit={handleSaveCommission} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Empleado</label>
                  <select value={commissionForm.employee_id || ''} onChange={e => setCommissionForm({ ...commissionForm, employee_id: e.target.value })} className="w-full border rounded-lg px-3 py-2" required>
                    <option value="">-- Seleccione --</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Servicio de Lavado</label>
                  <select value={commissionForm.wash_service_id || ''} onChange={e => setCommissionForm({ ...commissionForm, wash_service_id: e.target.value })} className="w-full border rounded-lg px-3 py-2" required>
                    <option value="">-- Seleccione --</option>
                    {washServices.map(svc => <option key={svc.id} value={svc.id}>{svc.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Porcentaje (%)</label>
                  <input type="number" min="0" max="100" step="0.01" value={commissionForm.percentage || ''} onChange={e => setCommissionForm({ ...commissionForm, percentage: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Monto Fijo</label>
                  <input type="number" min="0" value={commissionForm.fixed_amount || ''} onChange={e => setCommissionForm({ ...commissionForm, fixed_amount: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setCommissionModal(null)} className="flex-1 border rounded-lg py-2">Cancelar</button>
                <button type="submit" className="flex-1 bg-primary text-white rounded-lg py-2">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === CONFIRM DIALOGS === */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar Empleado"
        message="Esta seguro de eliminar este empleado? Esta accion no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
      <ConfirmDialog
        open={!!confirmDeleteSchedule}
        title="Eliminar Horario"
        message="Esta seguro de eliminar este horario?"
        confirmText="Eliminar"
        variant="danger"
        onConfirm={handleDeleteSchedule}
        onCancel={() => setConfirmDeleteSchedule(null)}
      />
      <ConfirmDialog
        open={!!confirmDeleteCommission}
        title="Eliminar Comision"
        message="Esta seguro de eliminar esta comision?"
        confirmText="Eliminar"
        variant="danger"
        onConfirm={handleDeleteCommission}
        onCancel={() => setConfirmDeleteCommission(null)}
      />
    </div>
  );
}
