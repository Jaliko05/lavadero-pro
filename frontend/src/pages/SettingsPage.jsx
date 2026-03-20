import { useState, useEffect } from 'react';
import {
  getWashConfig, updateWashConfig,
  listLocations, createLocation, updateLocation, deleteLocation,
  listNotificationTemplates, createNotificationTemplate, updateNotificationTemplate, deleteNotificationTemplate,
} from '@/api/config';
import {
  listServices, createService, updateService, deleteService,
  listServicePrices, createServicePrice, updateServicePrice, deleteServicePrice,
  listServicePackages, createServicePackage, updateServicePackage, deleteServicePackage,
} from '@/api/services';
import { listCategories, createCategory, updateCategory, deleteCategory } from '@/api/vehicle-categories';
import { getLoyaltyConfig, updateLoyaltyConfig } from '@/api/loyalty';
import { Settings, MapPin, Bell, Wrench, Car, Package, DollarSign, Gift, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import EmptyState from '@/components/shared/EmptyState';

const inputClass = 'w-full border rounded-lg px-3 py-2';

const EMPTY_SERVICE = { name: '', description: '', estimated_time_minutes: 30, status: 'activo' };
const EMPTY_CATEGORY = { name: '', description: '', icon: '' };
const EMPTY_PACKAGE = { name: '', description: '', price: 0, service_ids: [] };
const EMPTY_PRICE = { wash_service_id: '', vehicle_category_id: '', price: 0 };
const EMPTY_LOCATION = { name: '', address: '', phone: '', active: true };
const EMPTY_TEMPLATE = { trigger_event: '', channel: 'whatsapp', message_template: '', active: true };

export default function SettingsPage() {
  const [tab, setTab] = useState('general');
  const [loading, setLoading] = useState(true);

  // Data
  const [config, setConfig] = useState({});
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [packages, setPackages] = useState([]);
  const [prices, setPrices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loyaltyConfig, setLoyaltyConfig] = useState({});

  // Modal states
  const [modal, setModal] = useState(null); // 'service-create'|'service-edit'|'category-create'|...
  const [form, setForm] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        getWashConfig(), listServices(), listCategories(),
        listServicePackages(), listServicePrices(),
        listLocations(), listNotificationTemplates(), getLoyaltyConfig(),
      ]);
      if (results[0].status === 'fulfilled') setConfig(results[0].value.data || {});
      if (results[1].status === 'fulfilled') setServices(results[1].value.data || []);
      if (results[2].status === 'fulfilled') setCategories(results[2].value.data || []);
      if (results[3].status === 'fulfilled') setPackages(results[3].value.data || []);
      if (results[4].status === 'fulfilled') setPrices(results[4].value.data || []);
      if (results[5].status === 'fulfilled') setLocations(results[5].value.data || []);
      if (results[6].status === 'fulfilled') setTemplates(results[6].value.data || []);
      if (results[7].status === 'fulfilled') setLoyaltyConfig(results[7].value.data || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  // ── Generic CRUD helpers ────────────────────
  async function handleSave(type, createFn, updateFn, payload, isEdit, id) {
    try {
      if (isEdit) await updateFn(id, payload);
      else await createFn(payload);
      toast.success(isEdit ? 'Actualizado' : 'Creado');
      setModal(null);
      loadAll();
    } catch { toast.error('Error al guardar'); }
  }

  async function handleDelete(type, deleteFn, id) {
    try {
      await deleteFn(id);
      toast.success('Eliminado');
      setConfirmDelete(null);
      loadAll();
    } catch { toast.error('Error al eliminar'); }
  }

  // ── Config save ────────────────────
  async function saveConfig() {
    try { await updateWashConfig(config); toast.success('Configuracion guardada'); }
    catch { toast.error('Error al guardar'); }
  }

  async function saveLoyalty() {
    try {
      await updateLoyaltyConfig({
        ...loyaltyConfig,
        points_per_amount: Number(loyaltyConfig.points_per_amount),
        redemption_value: Number(loyaltyConfig.redemption_value),
        min_points_redeem: Number(loyaltyConfig.min_points_redeem),
      });
      toast.success('Configuracion de lealtad guardada');
    } catch { toast.error('Error al guardar'); }
  }

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'services', label: 'Servicios', icon: Wrench },
    { id: 'categories', label: 'Categorias', icon: Car },
    { id: 'packages', label: 'Paquetes', icon: Package },
    { id: 'prices', label: 'Precios', icon: DollarSign },
    { id: 'locations', label: 'Sedes', icon: MapPin },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'loyalty', label: 'Lealtad', icon: Gift },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuracion</h1>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${tab === t.id ? 'bg-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ════ GENERAL ════ */}
      {tab === 'general' && (
        <div className="bg-white rounded-lg border p-6 space-y-4 max-w-2xl">
          <h2 className="font-semibold">Datos del Negocio</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre" value={config.business_name} onChange={v => setConfig({ ...config, business_name: v })} />
            <Field label="NIT" value={config.nit} onChange={v => setConfig({ ...config, nit: v })} />
            <Field label="Direccion" value={config.address} onChange={v => setConfig({ ...config, address: v })} />
            <Field label="Ciudad" value={config.city} onChange={v => setConfig({ ...config, city: v })} />
            <Field label="Telefonos" value={config.phones} onChange={v => setConfig({ ...config, phones: v })} />
            <Field label="Email" value={config.email} onChange={v => setConfig({ ...config, email: v })} />
            <Field label="Regimen Tributario" value={config.tax_regime} onChange={v => setConfig({ ...config, tax_regime: v })} />
            <Field label="SMLMV" value={config.smlmv_value} onChange={v => setConfig({ ...config, smlmv_value: parseFloat(v) || 0 })} type="number" />
            <div className="col-span-2">
              <Field label="Mensaje para Display" value={config.display_message} onChange={v => setConfig({ ...config, display_message: v })} />
            </div>
          </div>
          <button onClick={saveConfig} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Guardar</button>
        </div>
      )}

      {/* ════ SERVICIOS ════ */}
      {tab === 'services' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setForm({ ...EMPTY_SERVICE }); setModal('service-create'); }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nuevo Servicio
            </button>
          </div>
          {services.length === 0 ? <EmptyState icon={Wrench} title="Sin servicios" description="Crea el primer servicio de lavado" /> : (
            <div className="bg-white rounded-lg border">
              <table className="w-full">
                <thead><tr className="border-b text-left text-sm text-slate-500">
                  <th className="p-3">Nombre</th><th className="p-3">Descripcion</th><th className="p-3">Tiempo Est.</th><th className="p-3">Estado</th><th className="p-3 text-right">Acciones</th>
                </tr></thead>
                <tbody>
                  {services.map(s => (
                    <tr key={s.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-medium">{s.name}</td>
                      <td className="p-3 text-sm text-slate-500">{s.description || '-'}</td>
                      <td className="p-3 text-sm">{s.estimated_time_minutes} min</td>
                      <td className="p-3"><span className={`text-xs px-2 py-1 rounded ${s.status === 'activo' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{s.status}</span></td>
                      <td className="p-3 text-right">
                        <button onClick={() => { setForm({ ...s }); setModal('service-edit'); }} className="p-1 hover:bg-slate-100 rounded"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => setConfirmDelete({ type: 'service', id: s.id, name: s.name })} className="p-1 hover:bg-red-50 rounded text-red-500 ml-1"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════ CATEGORIAS ════ */}
      {tab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setForm({ ...EMPTY_CATEGORY }); setModal('category-create'); }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nueva Categoria
            </button>
          </div>
          {categories.length === 0 ? <EmptyState icon={Car} title="Sin categorias" description="Crea la primera categoria de vehiculo" /> : (
            <div className="bg-white rounded-lg border">
              <table className="w-full">
                <thead><tr className="border-b text-left text-sm text-slate-500">
                  <th className="p-3">Nombre</th><th className="p-3">Descripcion</th><th className="p-3 text-right">Acciones</th>
                </tr></thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-medium"><span className="mr-2">{c.icon || '🚗'}</span>{c.name}</td>
                      <td className="p-3 text-sm text-slate-500">{c.description || '-'}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => { setForm({ ...c }); setModal('category-edit'); }} className="p-1 hover:bg-slate-100 rounded"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => setConfirmDelete({ type: 'category', id: c.id, name: c.name })} className="p-1 hover:bg-red-50 rounded text-red-500 ml-1"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════ PAQUETES ════ */}
      {tab === 'packages' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setForm({ ...EMPTY_PACKAGE }); setModal('package-create'); }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nuevo Paquete
            </button>
          </div>
          {packages.length === 0 ? <EmptyState icon={Package} title="Sin paquetes" description="Crea paquetes de servicios" /> : (
            <div className="bg-white rounded-lg border">
              <table className="w-full">
                <thead><tr className="border-b text-left text-sm text-slate-500">
                  <th className="p-3">Nombre</th><th className="p-3">Descripcion</th><th className="p-3 text-right">Precio</th><th className="p-3">Servicios</th><th className="p-3 text-right">Acciones</th>
                </tr></thead>
                <tbody>
                  {packages.map(p => (
                    <tr key={p.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-sm text-slate-500">{p.description || '-'}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(p.price)}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {(p.services || []).map((s, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{s.name || s}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => { setForm({ ...p, service_ids: p.service_ids || (p.services || []).map(s => s.id) }); setModal('package-edit'); }} className="p-1 hover:bg-slate-100 rounded"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => setConfirmDelete({ type: 'package', id: p.id, name: p.name })} className="p-1 hover:bg-red-50 rounded text-red-500 ml-1"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════ PRECIOS POR CATEGORIA ════ */}
      {tab === 'prices' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setForm({ ...EMPTY_PRICE }); setModal('price-create'); }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nuevo Precio
            </button>
          </div>
          {prices.length === 0 ? <EmptyState icon={DollarSign} title="Sin precios" description="Define precios por servicio y categoria" /> : (
            <div className="bg-white rounded-lg border">
              <table className="w-full">
                <thead><tr className="border-b text-left text-sm text-slate-500">
                  <th className="p-3">Servicio</th><th className="p-3">Categoria</th><th className="p-3 text-right">Precio</th><th className="p-3 text-right">Acciones</th>
                </tr></thead>
                <tbody>
                  {prices.map(p => (
                    <tr key={p.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-medium">{p.service_name || services.find(s => s.id === p.wash_service_id)?.name || p.wash_service_id}</td>
                      <td className="p-3">{p.category_name || categories.find(c => c.id === p.vehicle_category_id)?.name || p.vehicle_category_id}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(p.price)}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => { setForm({ ...p }); setModal('price-edit'); }} className="p-1 hover:bg-slate-100 rounded"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => setConfirmDelete({ type: 'price', id: p.id, name: 'este precio' })} className="p-1 hover:bg-red-50 rounded text-red-500 ml-1"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════ UBICACIONES ════ */}
      {tab === 'locations' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setForm({ ...EMPTY_LOCATION }); setModal('location-create'); }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nueva Sede
            </button>
          </div>
          {locations.length === 0 ? <EmptyState icon={MapPin} title="Sin sedes" description="Registra la primera ubicacion" /> : (
            <div className="bg-white rounded-lg border">
              <table className="w-full">
                <thead><tr className="border-b text-left text-sm text-slate-500">
                  <th className="p-3">Nombre</th><th className="p-3">Direccion</th><th className="p-3">Telefono</th><th className="p-3">Estado</th><th className="p-3 text-right">Acciones</th>
                </tr></thead>
                <tbody>
                  {locations.map(l => (
                    <tr key={l.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-medium">{l.name}</td>
                      <td className="p-3 text-sm">{l.address || '-'}</td>
                      <td className="p-3 text-sm">{l.phone || '-'}</td>
                      <td className="p-3"><span className={`text-xs px-2 py-1 rounded ${l.active !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{l.active !== false ? 'Activa' : 'Inactiva'}</span></td>
                      <td className="p-3 text-right">
                        <button onClick={() => { setForm({ ...l }); setModal('location-edit'); }} className="p-1 hover:bg-slate-100 rounded"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => setConfirmDelete({ type: 'location', id: l.id, name: l.name })} className="p-1 hover:bg-red-50 rounded text-red-500 ml-1"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════ NOTIFICACIONES ════ */}
      {tab === 'notifications' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setForm({ ...EMPTY_TEMPLATE }); setModal('template-create'); }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nueva Plantilla
            </button>
          </div>
          {templates.length === 0 ? <EmptyState icon={Bell} title="Sin plantillas" description="Crea plantillas de notificacion" /> : (
            <div className="bg-white rounded-lg border">
              <table className="w-full">
                <thead><tr className="border-b text-left text-sm text-slate-500">
                  <th className="p-3">Evento</th><th className="p-3">Canal</th><th className="p-3">Mensaje</th><th className="p-3">Estado</th><th className="p-3 text-right">Acciones</th>
                </tr></thead>
                <tbody>
                  {templates.map(t => (
                    <tr key={t.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-medium">{t.trigger_event}</td>
                      <td className="p-3"><span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{t.channel}</span></td>
                      <td className="p-3 text-sm text-slate-500 max-w-xs truncate">{t.message_template}</td>
                      <td className="p-3"><span className={`text-xs px-2 py-1 rounded ${t.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{t.active ? 'Activa' : 'Inactiva'}</span></td>
                      <td className="p-3 text-right">
                        <button onClick={() => { setForm({ ...t }); setModal('template-edit'); }} className="p-1 hover:bg-slate-100 rounded"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => setConfirmDelete({ type: 'template', id: t.id, name: t.trigger_event })} className="p-1 hover:bg-red-50 rounded text-red-500 ml-1"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════ LEALTAD ════ */}
      {tab === 'loyalty' && (
        <div className="bg-white rounded-lg border p-6 space-y-4 max-w-2xl">
          <h2 className="font-semibold">Programa de Puntos</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Puntos por monto ($)</label>
              <input type="number" value={loyaltyConfig.points_per_amount || ''} onChange={e => setLoyaltyConfig({ ...loyaltyConfig, points_per_amount: e.target.value })} className={inputClass} placeholder="Ej: 10000 = 1 punto por cada $10.000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valor de redencion por punto ($)</label>
              <input type="number" value={loyaltyConfig.redemption_value || ''} onChange={e => setLoyaltyConfig({ ...loyaltyConfig, redemption_value: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Minimo de puntos para redimir</label>
              <input type="number" value={loyaltyConfig.min_points_redeem || ''} onChange={e => setLoyaltyConfig({ ...loyaltyConfig, min_points_redeem: e.target.value })} className={inputClass} />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Activo</label>
              <button type="button" onClick={() => setLoyaltyConfig({ ...loyaltyConfig, active: !loyaltyConfig.active })}
                className={`relative w-11 h-6 rounded-full transition-colors ${loyaltyConfig.active ? 'bg-green-500' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${loyaltyConfig.active ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
          <button onClick={saveLoyalty} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Guardar</button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ════════════════════════════════════════════════════════════════ */}

      {/* Service Modal */}
      {(modal === 'service-create' || modal === 'service-edit') && (
        <Modal title={modal === 'service-create' ? 'Nuevo Servicio' : 'Editar Servicio'} onClose={() => setModal(null)}
          onSubmit={() => handleSave('service', createService, updateService,
            { ...form, estimated_time_minutes: Number(form.estimated_time_minutes) },
            modal === 'service-edit', form.id)}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Nombre</label>
              <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} required /></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Descripcion</label>
              <input value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-sm font-medium mb-1">Tiempo Estimado (min)</label>
              <input type="number" value={form.estimated_time_minutes || ''} onChange={e => setForm({ ...form, estimated_time_minutes: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-sm font-medium mb-1">Estado</label>
              <select value={form.status || 'activo'} onChange={e => setForm({ ...form, status: e.target.value })} className={inputClass}>
                <option value="activo">Activo</option><option value="inactivo">Inactivo</option>
              </select></div>
          </div>
        </Modal>
      )}

      {/* Category Modal */}
      {(modal === 'category-create' || modal === 'category-edit') && (
        <Modal title={modal === 'category-create' ? 'Nueva Categoria' : 'Editar Categoria'} onClose={() => setModal(null)}
          onSubmit={() => handleSave('category', createCategory, updateCategory, form, modal === 'category-edit', form.id)}>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Nombre</label>
              <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} required /></div>
            <div><label className="block text-sm font-medium mb-1">Descripcion</label>
              <input value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-sm font-medium mb-1">Icono (emoji)</label>
              <input value={form.icon || ''} onChange={e => setForm({ ...form, icon: e.target.value })} className={inputClass} placeholder="🚗" /></div>
          </div>
        </Modal>
      )}

      {/* Package Modal */}
      {(modal === 'package-create' || modal === 'package-edit') && (
        <Modal title={modal === 'package-create' ? 'Nuevo Paquete' : 'Editar Paquete'} onClose={() => setModal(null)}
          onSubmit={() => handleSave('package', createServicePackage, updateServicePackage,
            { ...form, price: Number(form.price), service_ids: form.service_ids || [] },
            modal === 'package-edit', form.id)}>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Nombre</label>
              <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} required /></div>
            <div><label className="block text-sm font-medium mb-1">Descripcion</label>
              <input value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-sm font-medium mb-1">Precio</label>
              <input type="number" value={form.price || ''} onChange={e => setForm({ ...form, price: e.target.value })} className={inputClass} required /></div>
            <div>
              <label className="block text-sm font-medium mb-1">Servicios incluidos</label>
              <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                {services.map(s => (
                  <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={(form.service_ids || []).includes(s.id)}
                      onChange={e => {
                        const ids = form.service_ids || [];
                        setForm({ ...form, service_ids: e.target.checked ? [...ids, s.id] : ids.filter(id => id !== s.id) });
                      }} className="rounded" />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Price Modal */}
      {(modal === 'price-create' || modal === 'price-edit') && (
        <Modal title={modal === 'price-create' ? 'Nuevo Precio' : 'Editar Precio'} onClose={() => setModal(null)}
          onSubmit={() => handleSave('price', createServicePrice, updateServicePrice,
            { ...form, price: Number(form.price) },
            modal === 'price-edit', form.id)}>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Servicio</label>
              <select value={form.wash_service_id || ''} onChange={e => setForm({ ...form, wash_service_id: e.target.value })} className={inputClass} required>
                <option value="">Seleccionar...</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium mb-1">Categoria de Vehiculo</label>
              <select value={form.vehicle_category_id || ''} onChange={e => setForm({ ...form, vehicle_category_id: e.target.value })} className={inputClass} required>
                <option value="">Seleccionar...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium mb-1">Precio</label>
              <input type="number" value={form.price || ''} onChange={e => setForm({ ...form, price: e.target.value })} className={inputClass} required /></div>
          </div>
        </Modal>
      )}

      {/* Location Modal */}
      {(modal === 'location-create' || modal === 'location-edit') && (
        <Modal title={modal === 'location-create' ? 'Nueva Sede' : 'Editar Sede'} onClose={() => setModal(null)}
          onSubmit={() => handleSave('location', createLocation, updateLocation, form, modal === 'location-edit', form.id)}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Nombre</label>
              <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} required /></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Direccion</label>
              <input value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-sm font-medium mb-1">Telefono</label>
              <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} /></div>
            <div className="flex items-center gap-3 pt-6">
              <label className="text-sm font-medium">Activa</label>
              <button type="button" onClick={() => setForm({ ...form, active: !form.active })}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.active ? 'bg-green-500' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.active ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Notification Template Modal */}
      {(modal === 'template-create' || modal === 'template-edit') && (
        <Modal title={modal === 'template-create' ? 'Nueva Plantilla' : 'Editar Plantilla'} onClose={() => setModal(null)}
          onSubmit={() => handleSave('template', createNotificationTemplate, updateNotificationTemplate, form, modal === 'template-edit', form.id)}>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Evento</label>
              <select value={form.trigger_event || ''} onChange={e => setForm({ ...form, trigger_event: e.target.value })} className={inputClass} required>
                <option value="">Seleccionar...</option>
                {['turn_created', 'turn_in_progress', 'turn_done', 'turn_delivered', 'payment_received', 'loyalty_earned'].map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select></div>
            <div><label className="block text-sm font-medium mb-1">Canal</label>
              <select value={form.channel || 'whatsapp'} onChange={e => setForm({ ...form, channel: e.target.value })} className={inputClass}>
                <option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="email">Email</option>
              </select></div>
            <div><label className="block text-sm font-medium mb-1">Plantilla del Mensaje</label>
              <textarea value={form.message_template || ''} onChange={e => setForm({ ...form, message_template: e.target.value })} className={inputClass} rows={3} required
                placeholder="Hola {nombre}, tu vehiculo {placa} esta listo..." /></div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Activa</label>
              <button type="button" onClick={() => setForm({ ...form, active: !form.active })}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.active ? 'bg-green-500' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.active ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!confirmDelete}
        title={`Eliminar ${confirmDelete?.name || ''}`}
        message="Esta seguro? Esta accion no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        onConfirm={() => {
          if (!confirmDelete) return;
          const map = {
            service: deleteService, category: deleteCategory, package: deleteServicePackage,
            price: deleteServicePrice, location: deleteLocation, template: deleteNotificationTemplate,
          };
          handleDelete(confirmDelete.type, map[confirmDelete.type], confirmDelete.id);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} className={inputClass} />
    </div>
  );
}

function Modal({ title, onClose, onSubmit, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="space-y-4">
          {children}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2">Cancelar</button>
            <button type="submit" className="flex-1 bg-primary text-white rounded-lg py-2">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
