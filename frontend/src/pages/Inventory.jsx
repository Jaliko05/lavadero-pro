import { useState, useEffect } from 'react';
import { listSupplies, getInventoryAlerts, listSuppliers } from '@/api/inventory';
import { listProducts } from '@/api/products';
import { formatCurrency } from '@/lib/utils';
import { Package, AlertTriangle, Droplets, Truck } from 'lucide-react';

export default function Inventory() {
  const [tab, setTab] = useState('alerts');
  const [alerts, setAlerts] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [al, pr, su, sp] = await Promise.allSettled([
        getInventoryAlerts(), listProducts(), listSupplies(), listSuppliers(),
      ]);
      if (al.status === 'fulfilled') setAlerts(al.value.data);
      if (pr.status === 'fulfilled') setProducts(pr.value.data);
      if (su.status === 'fulfilled') setSupplies(su.value.data);
      if (sp.status === 'fulfilled') setSuppliers(sp.value.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const tabs = [
    { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
    { id: 'products', label: 'Productos', icon: Package },
    { id: 'supplies', label: 'Insumos', icon: Droplets },
    { id: 'suppliers', label: 'Proveedores', icon: Truck },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inventario</h1>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${tab === t.id ? 'bg-white shadow-sm' : 'text-slate-600'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'alerts' && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center text-green-700">Sin alertas de inventario</div>
          ) : alerts.map((a, i) => (
            <div key={i} className={`rounded-lg border p-4 flex items-center justify-between ${a.level === 'critical' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className={`h-5 w-5 ${a.level === 'critical' ? 'text-red-600' : 'text-yellow-600'}`} />
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-sm text-slate-600">{a.type === 'product' ? 'Producto' : 'Insumo'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{a.stock}</p>
                <p className="text-xs text-slate-500">Min: {a.min_stock}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'products' && (
        <div className="bg-white rounded-lg border">
          <table className="w-full">
            <thead><tr className="border-b text-left text-sm text-slate-500">
              <th className="p-3">Producto</th><th className="p-3">Codigo</th><th className="p-3 text-right">Precio</th><th className="p-3 text-right">Stock</th><th className="p-3">Estado</th>
            </tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-sm text-slate-500">{p.code}</td>
                  <td className="p-3 text-right">{formatCurrency(p.sale_price)}</td>
                  <td className={`p-3 text-right font-medium ${p.stock <= p.min_stock ? 'text-red-600' : ''}`}>{p.stock}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded ${p.status === 'activo' ? 'bg-green-100 text-green-700' : 'bg-slate-100'}`}>{p.status}</span></td>
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-400">Sin productos</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'supplies' && (
        <div className="bg-white rounded-lg border">
          <table className="w-full">
            <thead><tr className="border-b text-left text-sm text-slate-500">
              <th className="p-3">Insumo</th><th className="p-3">Unidad</th><th className="p-3 text-right">Stock</th><th className="p-3 text-right">Min</th><th className="p-3 text-right">Costo/U</th>
            </tr></thead>
            <tbody>
              {supplies.map(s => (
                <tr key={s.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3 text-sm">{s.unit}</td>
                  <td className={`p-3 text-right font-medium ${s.stock <= s.min_stock ? 'text-red-600' : ''}`}>{s.stock}</td>
                  <td className="p-3 text-right text-slate-500">{s.min_stock}</td>
                  <td className="p-3 text-right">{formatCurrency(s.cost_per_unit)}</td>
                </tr>
              ))}
              {supplies.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-400">Sin insumos</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'suppliers' && (
        <div className="bg-white rounded-lg border">
          <div className="divide-y">
            {suppliers.map(s => (
              <div key={s.id} className="p-4">
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-slate-500">NIT: {s.nit || '-'} | Contacto: {s.contact_name || '-'} | Tel: {s.phone || '-'}</p>
                {s.payment_terms && <p className="text-xs text-slate-400 mt-1">Condiciones: {s.payment_terms}</p>}
              </div>
            ))}
            {suppliers.length === 0 && <p className="p-8 text-center text-slate-400">Sin proveedores</p>}
          </div>
        </div>
      )}
    </div>
  );
}
