import { useState, useEffect } from 'react';
import { listCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerHistory, createCustomerVehicle, updateCustomerVehicle, deleteCustomerVehicle } from '@/api/customers';
import { formatCurrency, cn } from '@/lib/utils';
import { Users, Search, Car, Star, Plus, Pencil, Trash2, History } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const EMPTY_CUSTOMER = { name: '', document: '', phone: '', email: '', type: 'natural', preferred_discount: 0, credit_approved: false, credit_limit: 0, notes: '' };
const EMPTY_VEHICLE = { plate: '', vehicle_category_id: '', nickname: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_CUSTOMER);
  const [vehicleModal, setVehicleModal] = useState(null);
  const [vehicleForm, setVehicleForm] = useState(EMPTY_VEHICLE);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { loadCustomers(); }, []);

  async function loadCustomers() {
    try { const res = await listCustomers(); setCustomers(res.data || []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function viewHistory(customer) {
    setSelected(customer);
    try { const res = await getCustomerHistory(customer.id); setHistory(res.data); }
    catch (e) { console.error(e); }
  }

  function openCreate() { setForm(EMPTY_CUSTOMER); setModal('create'); }
  function openEdit(c) { setForm({ ...c }); setModal('edit'); }

  async function handleSave(e) {
    e.preventDefault();
    try {
      if (modal === 'create') await createCustomer(form);
      else await updateCustomer(form.id, form);
      toast.success(modal === 'create' ? 'Cliente creado' : 'Cliente actualizado');
      setModal(null); loadCustomers();
    } catch { toast.error('Error al guardar'); }
  }

  async function handleDelete() {
    try { await deleteCustomer(confirmDelete); toast.success('Cliente eliminado'); setConfirmDelete(null); loadCustomers(); if (selected?.id === confirmDelete) { setSelected(null); setHistory(null); } }
    catch { toast.error('Error al eliminar'); }
  }

  function openCreateVehicle() { setVehicleForm({ ...EMPTY_VEHICLE, customer_id: selected.id }); setVehicleModal('create'); }
  function openEditVehicle(v) { setVehicleForm({ ...v }); setVehicleModal('edit'); }

  async function handleSaveVehicle(e) {
    e.preventDefault();
    try {
      if (vehicleModal === 'create') await createCustomerVehicle(vehicleForm);
      else await updateCustomerVehicle(vehicleForm.id, vehicleForm);
      toast.success('Vehiculo guardado');
      setVehicleModal(null); viewHistory(selected);
    } catch { toast.error('Error al guardar vehiculo'); }
  }

  async function handleDeleteVehicle(id) {
    try { await deleteCustomerVehicle(id); toast.success('Vehiculo eliminado'); viewHistory(selected); }
    catch { toast.error('Error al eliminar vehiculo'); }
  }

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) || c.document?.includes(search)
  );

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Nuevo Cliente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input type="text" placeholder="Buscar por nombre, telefono o documento..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border overflow-auto">
          <table className="w-full">
            <thead><tr className="border-b text-left text-sm text-slate-500">
              <th className="p-3">Nombre</th><th className="p-3">Telefono</th><th className="p-3">Tipo</th><th className="p-3">Credito</th><th className="p-3">Acciones</th>
            </tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className={cn('border-b hover:bg-slate-50 cursor-pointer', selected?.id === c.id && 'bg-blue-50')} onClick={() => viewHistory(c)}>
                  <td className="p-3"><p className="font-medium">{c.name}</p><p className="text-xs text-slate-400">{c.document || '-'}</p></td>
                  <td className="p-3 text-sm">{c.phone || '-'}</td>
                  <td className="p-3"><span className="text-xs px-2 py-1 bg-slate-100 rounded capitalize">{c.type}</span></td>
                  <td className="p-3 text-sm">{c.credit_approved ? formatCurrency(c.credit_limit) : '-'}</td>
                  <td className="p-3">
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-slate-100"><Pencil className="w-4 h-4 text-slate-500" /></button>
                      <button onClick={() => setConfirmDelete(c.id)} className="p-1.5 rounded hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-400">Sin resultados</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg border p-4">
          {selected && history ? (
            <div className="space-y-4">
              <div><h3 className="font-semibold text-lg">{selected.name}</h3><p className="text-sm text-slate-500">{selected.phone} | {selected.email || '-'}</p></div>
              <div className="flex gap-4">
                <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center">
                  <Star className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                  <p className="text-lg font-bold">{history.loyalty_balance || 0}</p>
                  <p className="text-xs text-slate-500">Puntos</p>
                </div>
                <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
                  <Car className="h-5 w-5 mx-auto text-green-600 mb-1" />
                  <p className="text-lg font-bold">{history.vehicles?.length || 0}</p>
                  <p className="text-xs text-slate-500">Vehiculos</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Vehiculos</h4>
                  <button onClick={openCreateVehicle} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />Agregar</button>
                </div>
                {history.vehicles?.map(v => (
                  <div key={v.id} className="flex items-center justify-between py-1.5 group">
                    <div className="flex items-center gap-2"><Car className="h-4 w-4 text-slate-400" /><span className="font-mono font-medium">{v.plate}</span>{v.nickname && <span className="text-xs text-slate-400">({v.nickname})</span>}</div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <button onClick={() => openEditVehicle(v)} className="p-1 hover:bg-slate-100 rounded"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => handleDeleteVehicle(v.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3 text-red-500" /></button>
                    </div>
                  </div>
                ))}
                {(!history.vehicles || history.vehicles.length === 0) && <p className="text-sm text-slate-400">Sin vehiculos</p>}
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">Ultimas Visitas</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {history.turns?.slice(0, 10).map(t => (
                    <div key={t.id} className="text-sm p-2 bg-slate-50 rounded">
                      <div className="flex justify-between"><span className="font-mono">{t.plate}</span><span className={cn('text-xs px-1.5 py-0.5 rounded', t.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700')}>{t.status}</span></div>
                      <p className="text-xs text-slate-400">{new Date(t.created_at).toLocaleDateString('es-CO')}</p>
                    </div>
                  ))}
                  {(!history.turns || history.turns.length === 0) && <p className="text-sm text-slate-400">Sin visitas</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-12"><Users className="h-8 w-8 mx-auto mb-2" /><p>Selecciona un cliente</p></div>
          )}
        </div>
      </div>

      {/* Customer Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{modal === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Nombre *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Documento</label><input value={form.document} onChange={e => setForm({ ...form, document: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                <div><label className="block text-sm font-medium mb-1">Telefono</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Tipo</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    <option value="natural">Natural</option><option value="empresa">Empresa</option><option value="flota">Flota</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium mb-1">Descuento preferido %</label><input type="number" value={form.preferred_discount} onChange={e => setForm({ ...form, preferred_discount: +e.target.value })} className="w-full border rounded-lg px-3 py-2" min={0} max={100} /></div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.credit_approved} onChange={e => setForm({ ...form, credit_approved: e.target.checked })} className="rounded" /><span className="text-sm">Credito aprobado</span></label>
                {form.credit_approved && <input type="number" placeholder="Limite" value={form.credit_limit} onChange={e => setForm({ ...form, credit_limit: +e.target.value })} className="border rounded-lg px-3 py-2 w-40" />}
              </div>
              <div><label className="block text-sm font-medium mb-1">Notas</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={2} /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 border rounded-lg py-2">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Modal */}
      {vehicleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setVehicleModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{vehicleModal === 'create' ? 'Agregar Vehiculo' : 'Editar Vehiculo'}</h3>
            <form onSubmit={handleSaveVehicle} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Placa *</label><input value={vehicleForm.plate} onChange={e => setVehicleForm({ ...vehicleForm, plate: e.target.value.toUpperCase() })} className="w-full border rounded-lg px-3 py-2 font-mono uppercase" maxLength={7} required /></div>
              <div><label className="block text-sm font-medium mb-1">Apodo</label><input value={vehicleForm.nickname} onChange={e => setVehicleForm({ ...vehicleForm, nickname: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Ej: Camioneta azul" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setVehicleModal(null)} className="flex-1 border rounded-lg py-2">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!confirmDelete} title="Eliminar cliente" message="Esta seguro? Se eliminara el cliente y toda su informacion." confirmText="Eliminar" onCancel={() => setConfirmDelete(null)} onConfirm={handleDelete} />
    </div>
  );
}
