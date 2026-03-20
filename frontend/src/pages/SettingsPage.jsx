import { useState, useEffect } from 'react';
import { getWashConfig, updateWashConfig, listLocations, listNotificationTemplates } from '@/api/config';
import { listServices } from '@/api/services';
import { listCategories } from '@/api/vehicle-categories';
import { Settings, MapPin, Bell, Wrench, Car } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [tab, setTab] = useState('general');
  const [config, setConfig] = useState({});
  const [locations, setLocations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [cfg, loc, tmpl, svc, cat] = await Promise.allSettled([
        getWashConfig(), listLocations(), listNotificationTemplates(),
        listServices(), listCategories(),
      ]);
      if (cfg.status === 'fulfilled') setConfig(cfg.value.data);
      if (loc.status === 'fulfilled') setLocations(loc.value.data);
      if (tmpl.status === 'fulfilled') setTemplates(tmpl.value.data);
      if (svc.status === 'fulfilled') setServices(svc.value.data);
      if (cat.status === 'fulfilled') setCategories(cat.value.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function saveConfig() {
    try {
      await updateWashConfig(config);
      toast.success('Configuracion guardada');
    } catch { toast.error('Error al guardar'); }
  }

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'services', label: 'Servicios', icon: Wrench },
    { id: 'categories', label: 'Vehiculos', icon: Car },
    { id: 'locations', label: 'Sedes', icon: MapPin },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuracion</h1>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${tab === t.id ? 'bg-white shadow-sm' : 'text-slate-600'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

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
          </div>
          <button onClick={saveConfig} className="px-6 py-2 bg-primary text-white rounded-lg">Guardar</button>
        </div>
      )}

      {tab === 'services' && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b"><h2 className="font-semibold">Servicios de Lavado ({services.length})</h2></div>
          <div className="divide-y">
            {services.map(s => (
              <div key={s.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-slate-500">{s.category} | {s.estimated_time_minutes} min</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${s.status === 'activo' ? 'bg-green-100 text-green-700' : 'bg-slate-100'}`}>{s.status}</span>
              </div>
            ))}
            {services.length === 0 && <p className="p-8 text-center text-slate-400">Sin servicios configurados</p>}
          </div>
        </div>
      )}

      {tab === 'categories' && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b"><h2 className="font-semibold">Categorias de Vehiculo ({categories.length})</h2></div>
          <div className="divide-y">
            {categories.map(c => (
              <div key={c.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{c.icon || '🚗'}</span>
                  <p className="font-medium">{c.name}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${c.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100'}`}>
                  {c.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            ))}
            {categories.length === 0 && <p className="p-8 text-center text-slate-400">Sin categorias</p>}
          </div>
        </div>
      )}

      {tab === 'locations' && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b"><h2 className="font-semibold">Sedes ({locations.length})</h2></div>
          <div className="divide-y">
            {locations.map(l => (
              <div key={l.id} className="p-4">
                <p className="font-medium">{l.name}</p>
                <p className="text-sm text-slate-500">{l.address} | {l.phone}</p>
              </div>
            ))}
            {locations.length === 0 && <p className="p-8 text-center text-slate-400">Sin sedes configuradas</p>}
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b"><h2 className="font-semibold">Plantillas de Notificacion ({templates.length})</h2></div>
          <div className="divide-y">
            {templates.map(t => (
              <div key={t.id} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{t.trigger_event}</p>
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{t.channel}</span>
                    <span className={`text-xs px-2 py-1 rounded ${t.active ? 'bg-green-100 text-green-700' : 'bg-slate-100'}`}>
                      {t.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-1 truncate">{t.message_template}</p>
              </div>
            ))}
            {templates.length === 0 && <p className="p-8 text-center text-slate-400">Sin plantillas</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
    </div>
  );
}
