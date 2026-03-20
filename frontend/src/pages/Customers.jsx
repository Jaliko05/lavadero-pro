import { useState, useEffect } from 'react';
import { listCustomers, getCustomerHistory } from '@/api/customers';
import { formatCurrency } from '@/lib/utils';
import { Users, Search, Car, Star, History } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState(null);

  useEffect(() => { loadCustomers(); }, []);

  async function loadCustomers() {
    try {
      const res = await listCustomers();
      setCustomers(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function viewHistory(customer) {
    setSelected(customer);
    try {
      const res = await getCustomerHistory(customer.id);
      setHistory(res.data);
    } catch (e) { console.error(e); }
  }

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.document?.includes(search)
  );

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <div className="text-sm text-slate-500">{customers.length} clientes registrados</div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input type="text" placeholder="Buscar por nombre, telefono o documento..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border">
          <table className="w-full">
            <thead><tr className="border-b text-left text-sm text-slate-500">
              <th className="p-3">Nombre</th><th className="p-3">Telefono</th><th className="p-3">Tipo</th><th className="p-3">Credito</th><th className="p-3"></th>
            </tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className={`border-b hover:bg-slate-50 cursor-pointer ${selected?.id === c.id ? 'bg-blue-50' : ''}`} onClick={() => viewHistory(c)}>
                  <td className="p-3">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.document || '-'}</p>
                  </td>
                  <td className="p-3 text-sm">{c.phone || '-'}</td>
                  <td className="p-3"><span className="text-xs px-2 py-1 bg-slate-100 rounded">{c.type}</span></td>
                  <td className="p-3 text-sm">{c.credit_approved ? formatCurrency(c.credit_limit) : '-'}</td>
                  <td className="p-3"><History className="h-4 w-4 text-slate-400" /></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-400">Sin resultados</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div className="bg-white rounded-lg border p-4">
          {selected && history ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selected.name}</h3>
                <p className="text-sm text-slate-500">{selected.phone} | {selected.email || '-'}</p>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center">
                  <Star className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                  <p className="text-lg font-bold">{history.loyalty_balance}</p>
                  <p className="text-xs text-slate-500">Puntos</p>
                </div>
                <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
                  <Car className="h-5 w-5 mx-auto text-green-600 mb-1" />
                  <p className="text-lg font-bold">{history.vehicles?.length || 0}</p>
                  <p className="text-xs text-slate-500">Vehiculos</p>
                </div>
              </div>

              {history.vehicles?.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Vehiculos</h4>
                  {history.vehicles.map(v => (
                    <div key={v.id} className="flex items-center gap-2 py-1">
                      <Car className="h-4 w-4 text-slate-400" />
                      <span className="font-mono font-medium">{v.plate}</span>
                      {v.nickname && <span className="text-xs text-slate-400">({v.nickname})</span>}
                    </div>
                  ))}
                </div>
              )}

              <div>
                <h4 className="font-medium text-sm mb-2">Ultimas Visitas</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {history.turns?.slice(0, 10).map(t => (
                    <div key={t.id} className="text-sm p-2 bg-slate-50 rounded">
                      <div className="flex justify-between">
                        <span className="font-mono">{t.plate}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${t.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{t.status}</span>
                      </div>
                      <p className="text-xs text-slate-400">{new Date(t.created_at).toLocaleDateString('es-CO')}</p>
                    </div>
                  ))}
                  {(!history.turns || history.turns.length === 0) && <p className="text-sm text-slate-400">Sin visitas</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-12">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p>Selecciona un cliente para ver su historial</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
