import { useState, useEffect } from 'react';
import { getMyTurns } from '@/api/turns';
import { formatCurrency, cn } from '@/lib/utils';
import { Car, CheckCircle, Clock, Star, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function MyStats() {
  const [turns, setTurns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyTurns()
      .then(res => setTurns(Array.isArray(res.data) ? res.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const now = new Date();
  const todayStr = now.toDateString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const completed = turns.filter(t => t.status === 'DELIVERED' || t.status === 'DONE');
  const todayTurns = turns.filter(t => new Date(t.created_at).toDateString() === todayStr);
  const monthTurns = turns.filter(t => new Date(t.created_at) >= monthStart);
  const inProgress = turns.filter(t => t.status === 'IN_PROGRESS').length;

  // Average time (minutes)
  const withTimes = completed.filter(t => t.started_at && t.completed_at);
  const avgTime = withTimes.length > 0
    ? Math.round(withTimes.reduce((sum, t) => sum + (new Date(t.completed_at) - new Date(t.started_at)) / 60000, 0) / withTimes.length)
    : 0;

  // Chart: turns per day (last 7 days)
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toDateString();
    const dayLabel = d.toLocaleDateString('es-CO', { weekday: 'short' });
    const count = turns.filter(t => new Date(t.created_at).toDateString() === dayStr).length;
    chartData.push({ day: dayLabel, turnos: count });
  }

  // Total earnings estimate (from services)
  const totalEarnings = completed.reduce((sum, t) => sum + (t.total_price || t.total || 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Mis Estadisticas</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Calendar className="h-5 w-5 text-blue-600" />} bg="bg-blue-100" label="Hoy" value={todayTurns.length} />
        <StatCard icon={<TrendingUp className="h-5 w-5 text-green-600" />} bg="bg-green-100" label="Este Mes" value={monthTurns.length} />
        <StatCard icon={<CheckCircle className="h-5 w-5 text-emerald-600" />} bg="bg-emerald-100" label="Completados" value={completed.length} />
        <StatCard icon={<Clock className="h-5 w-5 text-yellow-600" />} bg="bg-yellow-100" label="Tiempo Prom." value={avgTime ? `${avgTime} min` : '-'} />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="font-semibold mb-4 text-sm">Turnos por Dia (Ultima Semana)</h2>
        {chartData.some(d => d.turnos > 0) ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="turnos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-slate-400 py-8 text-sm">Sin datos esta semana</p>
        )}
      </div>

      {/* Recent turns */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b"><h2 className="font-semibold text-sm">Ultimos Turnos</h2></div>
        <div className="divide-y">
          {turns.slice(0, 10).map(t => (
            <div key={t.id} className="p-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{t.plate}</span>
                  <span className="text-xs text-slate-400">#{t.daily_number}</span>
                </div>
                <p className="text-xs text-slate-500">{new Date(t.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <span className={cn(
                'text-xs px-2 py-1 rounded font-medium',
                t.status === 'DELIVERED' || t.status === 'DONE' ? 'bg-green-100 text-green-700' :
                t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                t.status === 'PAUSED' ? 'bg-orange-100 text-orange-700' :
                'bg-slate-100 text-slate-600'
              )}>
                {t.status === 'WAITING' ? 'Esperando' :
                 t.status === 'IN_PROGRESS' ? 'En Progreso' :
                 t.status === 'PAUSED' ? 'Pausado' :
                 t.status === 'DONE' ? 'Listo' :
                 t.status === 'DELIVERED' ? 'Entregado' : t.status}
              </span>
            </div>
          ))}
          {turns.length === 0 && <p className="p-6 text-center text-slate-400 text-sm">Sin turnos asignados</p>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, bg, label, value }) {
  return (
    <div className="bg-white rounded-lg border p-4 text-center">
      <div className={cn('inline-flex p-2 rounded-full mb-2', bg)}>{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
