import { useState, useEffect } from 'react';
import { listClients, createClient, updateClient, deleteClient } from '@/api/clients';
import { UserCog, Plus, Edit2, Trash2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY = { business_name: '', nit: '', plan: 'basic', email: '', phone: '', address: '', city: '', status: 'activo' };

export default function SuperAdmin() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => { load(); }, []);

  async function load() {
    try { const res = await listClients(); setClients(res.data || []); }
    catch { console.error('Error loading clients'); }
    finally { setLoading(false); }
  }

  function openCreate() { setForm(EMPTY); setModal('create'); }
  function openEdit(c) { setForm({ ...c }); setModal('edit'); }

  async function handleSave(e) {
    e.preventDefault();
    try {
      if (modal === 'create') await createClient(form);
      else await updateClient(form.id, form);
      toast.success(modal === 'create' ? 'Tenant creado' : 'Tenant actualizado');
      setModal(null);
      load();
    } catch { toast.error('Error al guardar'); }
  }

  async function handleDelete(id) {
    if (!confirm('Eliminar este tenant?')) return;
    try { await deleteClient(id); toast.success('Eliminado'); load(); }
    catch { toast.error('Error al eliminar'); }
  }

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Super Admin - Tenants</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nuevo Tenant
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-3xl font-bold">{clients.length}</p>
          <p className="text-sm text-slate-500">Total Tenants</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{clients.filter(c => c.status === 'activo').length}</p>
          <p className="text-sm text-slate-500">Activos</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-3xl font-bold text-slate-400">{clients.filter(c => c.status !== 'activo').length}</p>
          <p className="text-sm text-slate-500">Inactivos</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <table className="w-full">
          <thead><tr className="border-b text-left text-sm text-slate-500">
            <th className="p-3">Negocio</th><th className="p-3">NIT</th><th className="p-3">Plan</th><th className="p-3">Ciudad</th><th className="p-3">Estado</th><th className="p-3 text-right">Acciones</th>
          </tr></thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} className="border-b hover:bg-slate-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="font-medium">{c.business_name}</p>
                      <p className="text-xs text-slate-500">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-sm">{c.nit || '-'}</td>
                <td className="p-3"><span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">{c.plan || 'basic'}</span></td>
                <td className="p-3 text-sm">{c.city || '-'}</td>
                <td className="p-3"><span className={`text-xs px-2 py-1 rounded ${c.status === 'activo' ? 'bg-green-100 text-green-700' : 'bg-slate-100'}`}>{c.status}</span></td>
                <td className="p-3 text-right">
                  <button onClick={() => openEdit(c)} className="p-1 hover:bg-slate-100 rounded"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1 hover:bg-red-50 rounded text-red-500 ml-1"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-400">Sin tenants registrados</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{modal === 'create' ? 'Nuevo Tenant' : 'Editar Tenant'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nombre del Negocio</label>
                  <input value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">NIT</label>
                  <input value={form.nit || ''} onChange={e => setForm({ ...form, nit: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Plan</label>
                  <select value={form.plan || 'basic'} onChange={e => setForm({ ...form, plan: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    <option value="basic">Basic</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefono</label>
                  <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ciudad</label>
                  <input value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estado</label>
                  <select value={form.status || 'activo'} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    <option value="activo">Activo</option><option value="inactivo">Inactivo</option><option value="suspendido">Suspendido</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Direccion</label>
                  <input value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 border rounded-lg py-2">Cancelar</button>
                <button type="submit" className="flex-1 bg-primary text-white rounded-lg py-2">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
