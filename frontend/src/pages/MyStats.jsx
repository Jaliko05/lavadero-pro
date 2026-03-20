import { useState, useEffect } from 'react';
import { getMyTurns } from '@/api/turns';
import { Car, CheckCircle, Clock, Star } from 'lucide-react';

export default function MyStats() {
  const [turns, setTurns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyTurns().then(res => setTurns(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const completed = turns.filter(t => t.status === 'DELIVERED').length;
  const inProgress = turns.filter(t => t.status === 'IN_PROGRESS').length;
  const today = turns.filter(t => new Date(t.created_at).toDateString() === new Date().toDateString()).length;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Mis Estadisticas</h1>

      <div className="grid grid-cols-2 gap-4">
        <Stat icon={<Car className="h-6 w-6 text-blue-600" />} color="blue" label="Total Turnos" value={turns.length} />
        <Stat icon={<CheckCircle className="h-6 w-6 text-green-600" />} color="green" label="Completados" value={completed} />
        <Stat icon={<Clock className="h-6 w-6 text-yellow-600" />} color="yellow" label="En Progreso" value={inProgress} />
        <Stat icon={<Star className="h-6 w-6 text-purple-600" />} color="purple" label="Hoy" value={today} />
      </div>

      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b"><h2 className="font-semibold">Ultimos Turnos</h2></div>
        <div className="divide-y">
          {turns.slice(0, 10).map(t => (
            <div key={t.id} className="p-3 flex items-center justify-between">
              <div>
                <span className="font-mono font-medium">{t.plate}</span>
                <p className="text-xs text-slate-500">{new Date(t.created_at).toLocaleDateString('es-CO')}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${t.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100'}`}>
                {t.status}
              </span>
            </div>
          ))}
          {turns.length === 0 && <p className="p-6 text-center text-slate-400">Sin turnos asignados</p>}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, color, label, value }) {
  return (
    <div className="bg-white rounded-lg border p-4 text-center">
      <div className={`inline-flex p-3 bg-${color}-100 rounded-full mb-2`}>{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
