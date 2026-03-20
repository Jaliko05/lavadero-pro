import { useState, useEffect } from 'react';
import {
  listSupplies, createSupply, updateSupply, deleteSupply,
  listSupplyConsumptions, createSupplyConsumption, updateSupplyConsumption, deleteSupplyConsumption,
  listSuppliers, createSupplier, updateSupplier, deleteSupplier,
  listPurchaseOrders, createPurchaseOrder, deletePurchaseOrder,
  getInventoryAlerts, listInventoryMovements,
} from '@/api/inventory';
import { listServices } from '@/api/services';
import { listProducts } from '@/api/products';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  AlertTriangle, Droplets, Link2, Truck, ShoppingCart, ArrowRightLeft,
  Plus, Edit2, Trash2, X,
} from 'lucide-react';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import EmptyState from '@/components/shared/EmptyState';

// ── Empty form templates ──────────────────────────────────────────────
const EMPTY_SUPPLY = { name: '', unit: 'unidades', stock: 0, min_stock: 0, emergency_stock: 0, cost_per_unit: 0 };
const EMPTY_CONSUMPTION = { wash_service_id: '', wash_supply_id: '', quantity_per_service: 0 };
const EMPTY_SUPPLIER = { name: '', nit: '', contact_name: '', phone: '', email: '', payment_terms: '' };
const EMPTY_ORDER = { supplier_id: '', date: new Date().toISOString().slice(0, 10), payment_method: 'efectivo', items: [] };
const EMPTY_ORDER_ITEM = { item_type: 'supply', item_id: '', quantity: 1, unit_price: 0 };

const UNIT_OPTIONS = ['litros', 'unidades', 'recargas', 'kilos'];
const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'credito', label: 'Credito' },
];

const inputClass = 'w-full border rounded-lg px-3 py-2';

export default function Inventory() {
  const [tab, setTab] = useState('alerts');
  const [loading, setLoading] = useState(true);

  // Data
  const [alerts, setAlerts] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [consumptions, setConsumptions] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [movements, setMovements] = useState([]);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);

  // Modal & form state
  const [modal, setModal] = useState(null);
  const [supplyForm, setSupplyForm] = useState(EMPTY_SUPPLY);
  const [consumptionForm, setConsumptionForm] = useState(EMPTY_CONSUMPTION);
  const [supplierForm, setSupplierForm] = useState(EMPTY_SUPPLIER);
  const [orderForm, setOrderForm] = useState(EMPTY_ORDER);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [al, su, co, sp, or, mv, sv, pr] = await Promise.allSettled([
        getInventoryAlerts(),
        listSupplies(),
        listSupplyConsumptions(),
        listSuppliers(),
        listPurchaseOrders(),
        listInventoryMovements(),
        listServices(),
        listProducts(),
      ]);
      if (al.status === 'fulfilled') setAlerts(al.value.data || []);
      if (su.status === 'fulfilled') setSupplies(su.value.data || []);
      if (co.status === 'fulfilled') setConsumptions(co.value.data || []);
      if (sp.status === 'fulfilled') setSuppliers(sp.value.data || []);
      if (or.status === 'fulfilled') setOrders(or.value.data || []);
      if (mv.status === 'fulfilled') setMovements(mv.value.data || []);
      if (sv.status === 'fulfilled') setServices(sv.value.data || []);
      if (pr.status === 'fulfilled') setProducts(pr.value.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  function findName(list, id) {
    const item = list.find(i => i.id === id);
    return item ? item.name : id || '-';
  }

  function openConfirmDelete(title, message, onConfirm) {
    setConfirmDialog({ open: true, title, message, onConfirm });
  }

  function closeConfirm() {
    setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
  }

  // ══════════════════════════════════════════════════════════════════════
  // SUPPLIES CRUD
  // ══════════════════════════════════════════════════════════════════════
  function openCreateSupply() { setSupplyForm({ ...EMPTY_SUPPLY }); setModal('supply-create'); }
  function openEditSupply(s) { setSupplyForm({ ...s }); setModal('supply-edit'); }

  async function handleSaveSupply(e) {
    e.preventDefault();
    try {
      const payload = {
        ...supplyForm,
        stock: Number(supplyForm.stock),
        min_stock: Number(supplyForm.min_stock),
        emergency_stock: Number(supplyForm.emergency_stock),
        cost_per_unit: Number(supplyForm.cost_per_unit),
      };
      if (modal === 'supply-create') await createSupply(payload);
      else await updateSupply(supplyForm.id, payload);
      toast.success(modal === 'supply-create' ? 'Insumo creado' : 'Insumo actualizado');
      setModal(null);
      loadAll();
    } catch { toast.error('Error al guardar insumo'); }
  }

  function handleDeleteSupply(id) {
    openConfirmDelete('Eliminar Insumo', 'Esta seguro de eliminar este insumo? Esta accion no se puede deshacer.', async () => {
      try { await deleteSupply(id); toast.success('Insumo eliminado'); closeConfirm(); loadAll(); }
      catch { toast.error('Error al eliminar insumo'); closeConfirm(); }
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // CONSUMPTIONS CRUD
  // ══════════════════════════════════════════════════════════════════════
  function openCreateConsumption() { setConsumptionForm({ ...EMPTY_CONSUMPTION }); setModal('consumption-create'); }
  function openEditConsumption(c) { setConsumptionForm({ ...c }); setModal('consumption-edit'); }

  async function handleSaveConsumption(e) {
    e.preventDefault();
    try {
      const payload = { ...consumptionForm, quantity_per_service: Number(consumptionForm.quantity_per_service) };
      if (modal === 'consumption-create') await createSupplyConsumption(payload);
      else await updateSupplyConsumption(consumptionForm.id, payload);
      toast.success(modal === 'consumption-create' ? 'Consumo creado' : 'Consumo actualizado');
      setModal(null);
      loadAll();
    } catch { toast.error('Error al guardar consumo'); }
  }

  function handleDeleteConsumption(id) {
    openConfirmDelete('Eliminar Consumo', 'Esta seguro de eliminar este consumo por servicio?', async () => {
      try { await deleteSupplyConsumption(id); toast.success('Consumo eliminado'); closeConfirm(); loadAll(); }
      catch { toast.error('Error al eliminar consumo'); closeConfirm(); }
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // SUPPLIERS CRUD
  // ══════════════════════════════════════════════════════════════════════
  function openCreateSupplier() { setSupplierForm({ ...EMPTY_SUPPLIER }); setModal('supplier-create'); }
  function openEditSupplier(s) { setSupplierForm({ ...s }); setModal('supplier-edit'); }

  async function handleSaveSupplier(e) {
    e.preventDefault();
    try {
      if (modal === 'supplier-create') await createSupplier(supplierForm);
      else await updateSupplier(supplierForm.id, supplierForm);
      toast.success(modal === 'supplier-create' ? 'Proveedor creado' : 'Proveedor actualizado');
      setModal(null);
      loadAll();
    } catch { toast.error('Error al guardar proveedor'); }
  }

  function handleDeleteSupplier(id) {
    openConfirmDelete('Eliminar Proveedor', 'Esta seguro de eliminar este proveedor?', async () => {
      try { await deleteSupplier(id); toast.success('Proveedor eliminado'); closeConfirm(); loadAll(); }
      catch { toast.error('Error al eliminar proveedor'); closeConfirm(); }
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // PURCHASE ORDERS
  // ══════════════════════════════════════════════════════════════════════
  function openCreateOrder() {
    setOrderForm({ ...EMPTY_ORDER, date: new Date().toISOString().slice(0, 10), items: [{ ...EMPTY_ORDER_ITEM }] });
    setModal('order-create');
  }

  function addOrderItem() {
    setOrderForm(prev => ({ ...prev, items: [...prev.items, { ...EMPTY_ORDER_ITEM }] }));
  }

  function updateOrderItem(index, field, value) {
    setOrderForm(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      // Reset item_id when item_type changes
      if (field === 'item_type') items[index].item_id = '';
      return { ...prev, items };
    });
  }

  function removeOrderItem(index) {
    setOrderForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  }

  function getOrderTotal() {
    return orderForm.items.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.unit_price)), 0);
  }

  async function handleSaveOrder(e) {
    e.preventDefault();
    if (orderForm.items.length === 0) { toast.error('Agregue al menos un item'); return; }
    try {
      const payload = {
        ...orderForm,
        items: orderForm.items.map(it => ({
          ...it,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
        })),
      };
      await createPurchaseOrder(payload);
      toast.success('Orden de compra creada');
      setModal(null);
      loadAll();
    } catch { toast.error('Error al crear orden de compra'); }
  }

  function handleDeleteOrder(id) {
    openConfirmDelete('Eliminar Orden', 'Esta seguro de eliminar esta orden de compra?', async () => {
      try { await deletePurchaseOrder(id); toast.success('Orden eliminada'); closeConfirm(); loadAll(); }
      catch { toast.error('Error al eliminar orden'); closeConfirm(); }
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const tabs = [
    { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
    { id: 'supplies', label: 'Insumos', icon: Droplets },
    { id: 'consumptions', label: 'Consumos', icon: Link2 },
    { id: 'suppliers', label: 'Proveedores', icon: Truck },
    { id: 'orders', label: 'Ordenes de Compra', icon: ShoppingCart },
    { id: 'movements', label: 'Movimientos', icon: ArrowRightLeft },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inventario</h1>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit flex-wrap">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
              tab === t.id ? 'bg-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 1 - ALERTAS */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {tab === 'alerts' && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center text-green-700">
              Sin alertas de inventario. Todos los niveles de stock estan bien.
            </div>
          ) : (
            <div className="bg-white rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-slate-500">
                    <th className="p-3">Nivel</th>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3 text-right">Stock Actual</th>
                    <th className="p-3 text-right">Min. Stock</th>
                    <th className="p-3 text-right">Emergencia</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a, i) => {
                    const isCritical = a.level === 'critical';
                    return (
                      <tr key={i} className={`border-b ${isCritical ? 'bg-red-50' : 'bg-amber-50'}`}>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${
                            isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            <AlertTriangle className="h-3 w-3" />
                            {isCritical ? 'Critico' : 'Bajo'}
                          </span>
                        </td>
                        <td className="p-3 font-medium">{a.name}</td>
                        <td className="p-3 text-sm text-slate-600">{a.type === 'product' ? 'Producto' : 'Insumo'}</td>
                        <td className={`p-3 text-right font-bold ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>{a.stock}</td>
                        <td className="p-3 text-right text-slate-500">{a.min_stock}</td>
                        <td className="p-3 text-right text-slate-500">{a.emergency_stock ?? '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 2 - INSUMOS */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {tab === 'supplies' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openCreateSupply} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nuevo Insumo
            </button>
          </div>

          {supplies.length === 0 ? (
            <EmptyState icon={Droplets} title="Sin insumos" description="Crea el primer insumo para comenzar" />
          ) : (
            <div className="bg-white rounded-lg border overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-slate-500">
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Unidad</th>
                    <th className="p-3 text-right">Stock</th>
                    <th className="p-3 text-right">Min. Stock</th>
                    <th className="p-3 text-right">Emergencia</th>
                    <th className="p-3 text-right">Costo/U</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {supplies.map(s => {
                    const isCritical = s.stock <= (s.emergency_stock || 0);
                    const isWarning = !isCritical && s.stock <= (s.min_stock || 0);
                    return (
                      <tr key={s.id} className={`border-b hover:bg-slate-50 ${isCritical ? 'bg-red-50' : isWarning ? 'bg-amber-50' : ''}`}>
                        <td className="p-3 font-medium">{s.name}</td>
                        <td className="p-3 text-sm">{s.unit}</td>
                        <td className={`p-3 text-right font-medium ${isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : ''}`}>
                          {s.stock}
                        </td>
                        <td className="p-3 text-right text-slate-500">{s.min_stock}</td>
                        <td className="p-3 text-right text-slate-500">{s.emergency_stock}</td>
                        <td className="p-3 text-right">{formatCurrency(s.cost_per_unit)}</td>
                        <td className="p-3 text-right">
                          <button onClick={() => openEditSupply(s)} className="p-1 hover:bg-slate-100 rounded"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteSupply(s.id)} className="p-1 hover:bg-red-50 rounded text-red-500 ml-1"><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 3 - CONSUMOS */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {tab === 'consumptions' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openCreateConsumption} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nuevo Consumo
            </button>
          </div>

          {consumptions.length === 0 ? (
            <EmptyState icon={Link2} title="Sin consumos configurados" description="Define cuanto insumo consume cada servicio" />
          ) : (
            <div className="bg-white rounded-lg border overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-slate-500">
                    <th className="p-3">Servicio</th>
                    <th className="p-3">Insumo</th>
                    <th className="p-3 text-right">Cantidad por Servicio</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {consumptions.map(c => (
                    <tr key={c.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-medium">{c.wash_service_name || findName(services, c.wash_service_id)}</td>
                      <td className="p-3">{c.wash_supply_name || findName(supplies, c.wash_supply_id)}</td>
                      <td className="p-3 text-right font-medium">{c.quantity_per_service}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => openEditConsumption(c)} className="p-1 hover:bg-slate-100 rounded"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteConsumption(c.id)} className="p-1 hover:bg-red-50 rounded text-red-500 ml-1"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 4 - PROVEEDORES */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {tab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openCreateSupplier} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nuevo Proveedor
            </button>
          </div>

          {suppliers.length === 0 ? (
            <EmptyState icon={Truck} title="Sin proveedores" description="Registra tu primer proveedor" />
          ) : (
            <div className="bg-white rounded-lg border overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-slate-500">
                    <th className="p-3">Nombre</th>
                    <th className="p-3">NIT</th>
                    <th className="p-3">Contacto</th>
                    <th className="p-3">Telefono</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Condiciones de Pago</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map(s => (
                    <tr key={s.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-medium">{s.name}</td>
                      <td className="p-3 text-sm">{s.nit || '-'}</td>
                      <td className="p-3 text-sm">{s.contact_name || '-'}</td>
                      <td className="p-3 text-sm">{s.phone || '-'}</td>
                      <td className="p-3 text-sm">{s.email || '-'}</td>
                      <td className="p-3 text-sm text-slate-500">{s.payment_terms || '-'}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => openEditSupplier(s)} className="p-1 hover:bg-slate-100 rounded"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteSupplier(s.id)} className="p-1 hover:bg-red-50 rounded text-red-500 ml-1"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 5 - ORDENES DE COMPRA */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {tab === 'orders' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openCreateOrder} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nueva Orden
            </button>
          </div>

          {orders.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="Sin ordenes de compra" description="Crea tu primera orden de compra" />
          ) : (
            <div className="bg-white rounded-lg border overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-slate-500">
                    <th className="p-3">ID</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Proveedor</th>
                    <th className="p-3">Metodo de Pago</th>
                    <th className="p-3 text-right">Items</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 text-sm font-mono text-slate-500">#{o.id}</td>
                      <td className="p-3 text-sm">{formatDate(o.date || o.created_at)}</td>
                      <td className="p-3 font-medium">{o.supplier_name || findName(suppliers, o.supplier_id)}</td>
                      <td className="p-3 text-sm capitalize">{o.payment_method || '-'}</td>
                      <td className="p-3 text-right">{o.items?.length || o.item_count || 0}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(o.total || 0)}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleDeleteOrder(o.id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 6 - MOVIMIENTOS */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {tab === 'movements' && (
        <div className="space-y-4">
          {movements.length === 0 ? (
            <EmptyState icon={ArrowRightLeft} title="Sin movimientos" description="Los movimientos de inventario se registran automaticamente" />
          ) : (
            <div className="bg-white rounded-lg border overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-slate-500">
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Tipo Item</th>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Tipo Movimiento</th>
                    <th className="p-3 text-right">Cantidad</th>
                    <th className="p-3 text-right">Saldo Despues</th>
                    <th className="p-3">Referencia</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m, i) => {
                    const isEntry = m.movement_type === 'entrada' || m.movement_type === 'entry' || m.quantity > 0;
                    return (
                      <tr key={m.id || i} className="border-b hover:bg-slate-50">
                        <td className="p-3 text-sm">{formatDate(m.date || m.created_at)}</td>
                        <td className="p-3 text-sm capitalize">{m.item_type === 'product' ? 'Producto' : m.item_type === 'supply' ? 'Insumo' : m.item_type || '-'}</td>
                        <td className="p-3 font-medium">{m.item_name || '-'}</td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-1 rounded font-medium ${
                            isEntry ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {m.movement_type || (isEntry ? 'entrada' : 'salida')}
                          </span>
                        </td>
                        <td className={`p-3 text-right font-medium ${isEntry ? 'text-green-600' : 'text-red-600'}`}>
                          {isEntry ? '+' : ''}{m.quantity}
                        </td>
                        <td className="p-3 text-right">{m.balance_after ?? '-'}</td>
                        <td className="p-3 text-sm text-slate-500">{m.reference || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL - INSUMOS */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {(modal === 'supply-create' || modal === 'supply-edit') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{modal === 'supply-create' ? 'Nuevo Insumo' : 'Editar Insumo'}</h3>
            <form onSubmit={handleSaveSupply} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <input value={supplyForm.name} onChange={e => setSupplyForm({ ...supplyForm, name: e.target.value })} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unidad</label>
                  <select value={supplyForm.unit} onChange={e => setSupplyForm({ ...supplyForm, unit: e.target.value })} className={inputClass}>
                    {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock</label>
                  <input type="number" step="any" value={supplyForm.stock} onChange={e => setSupplyForm({ ...supplyForm, stock: e.target.value })} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock Minimo</label>
                  <input type="number" step="any" value={supplyForm.min_stock} onChange={e => setSupplyForm({ ...supplyForm, min_stock: e.target.value })} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock de Emergencia</label>
                  <input type="number" step="any" value={supplyForm.emergency_stock} onChange={e => setSupplyForm({ ...supplyForm, emergency_stock: e.target.value })} className={inputClass} required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Costo por Unidad</label>
                  <input type="number" step="any" value={supplyForm.cost_per_unit} onChange={e => setSupplyForm({ ...supplyForm, cost_per_unit: e.target.value })} className={inputClass} required />
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

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL - CONSUMOS */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {(modal === 'consumption-create' || modal === 'consumption-edit') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{modal === 'consumption-create' ? 'Nuevo Consumo por Servicio' : 'Editar Consumo por Servicio'}</h3>
            <form onSubmit={handleSaveConsumption} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Servicio de Lavado</label>
                <select value={consumptionForm.wash_service_id} onChange={e => setConsumptionForm({ ...consumptionForm, wash_service_id: e.target.value })} className={inputClass} required>
                  <option value="">Seleccionar servicio...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Insumo</label>
                <select value={consumptionForm.wash_supply_id} onChange={e => setConsumptionForm({ ...consumptionForm, wash_supply_id: e.target.value })} className={inputClass} required>
                  <option value="">Seleccionar insumo...</option>
                  {supplies.map(s => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cantidad por Servicio</label>
                <input type="number" step="any" value={consumptionForm.quantity_per_service} onChange={e => setConsumptionForm({ ...consumptionForm, quantity_per_service: e.target.value })} className={inputClass} required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 border rounded-lg py-2">Cancelar</button>
                <button type="submit" className="flex-1 bg-primary text-white rounded-lg py-2">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL - PROVEEDORES */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {(modal === 'supplier-create' || modal === 'supplier-edit') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{modal === 'supplier-create' ? 'Nuevo Proveedor' : 'Editar Proveedor'}</h3>
            <form onSubmit={handleSaveSupplier} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <input value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">NIT</label>
                  <input value={supplierForm.nit || ''} onChange={e => setSupplierForm({ ...supplierForm, nit: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre de Contacto</label>
                  <input value={supplierForm.contact_name || ''} onChange={e => setSupplierForm({ ...supplierForm, contact_name: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefono</label>
                  <input value={supplierForm.phone || ''} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" value={supplierForm.email || ''} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Condiciones de Pago</label>
                  <input value={supplierForm.payment_terms || ''} onChange={e => setSupplierForm({ ...supplierForm, payment_terms: e.target.value })} className={inputClass} placeholder="Ej: 30 dias, contado, etc." />
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

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL - ORDEN DE COMPRA */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {modal === 'order-create' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Nueva Orden de Compra</h3>
            <form onSubmit={handleSaveOrder} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Proveedor</label>
                  <select value={orderForm.supplier_id} onChange={e => setOrderForm({ ...orderForm, supplier_id: e.target.value })} className={inputClass} required>
                    <option value="">Seleccionar...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha</label>
                  <input type="date" value={orderForm.date} onChange={e => setOrderForm({ ...orderForm, date: e.target.value })} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Metodo de Pago</label>
                  <select value={orderForm.payment_method} onChange={e => setOrderForm({ ...orderForm, payment_method: e.target.value })} className={inputClass}>
                    {PAYMENT_METHODS.map(pm => <option key={pm.value} value={pm.value}>{pm.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Items</label>
                  <button type="button" onClick={addOrderItem} className="text-sm text-primary hover:underline flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Agregar item
                  </button>
                </div>
                <div className="space-y-3">
                  {orderForm.items.map((item, idx) => (
                    <div key={idx} className="border rounded-lg p-3 bg-slate-50">
                      <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-2">
                          <label className="block text-xs text-slate-500 mb-1">Tipo</label>
                          <select value={item.item_type} onChange={e => updateOrderItem(idx, 'item_type', e.target.value)} className={inputClass}>
                            <option value="supply">Insumo</option>
                            <option value="product">Producto</option>
                          </select>
                        </div>
                        <div className="col-span-4">
                          <label className="block text-xs text-slate-500 mb-1">Item</label>
                          <select value={item.item_id} onChange={e => updateOrderItem(idx, 'item_id', e.target.value)} className={inputClass} required>
                            <option value="">Seleccionar...</option>
                            {(item.item_type === 'supply' ? supplies : products).map(i => (
                              <option key={i.id} value={i.id}>{i.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-slate-500 mb-1">Cantidad</label>
                          <input type="number" step="any" min="0.01" value={item.quantity} onChange={e => updateOrderItem(idx, 'quantity', e.target.value)} className={inputClass} required />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-xs text-slate-500 mb-1">Precio Unitario</label>
                          <input type="number" step="any" min="0" value={item.unit_price} onChange={e => updateOrderItem(idx, 'unit_price', e.target.value)} className={inputClass} required />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button type="button" onClick={() => removeOrderItem(idx)} className="p-1 hover:bg-red-50 rounded text-red-500" title="Eliminar item">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-500 mt-1">
                        Subtotal: {formatCurrency(Number(item.quantity) * Number(item.unit_price))}
                      </div>
                    </div>
                  ))}
                </div>
                {orderForm.items.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">Sin items. Agrega al menos uno.</p>
                )}
              </div>

              {/* Total */}
              <div className="text-right border-t pt-3">
                <span className="text-sm text-slate-500">Total: </span>
                <span className="text-lg font-bold">{formatCurrency(getOrderTotal())}</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 border rounded-lg py-2">Cancelar</button>
                <button type="submit" className="flex-1 bg-primary text-white rounded-lg py-2">Crear Orden</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Dialog ── */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}
