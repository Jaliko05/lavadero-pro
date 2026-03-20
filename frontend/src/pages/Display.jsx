import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getDisplay } from '@/api/turns';
import { formatTime, cn } from '@/lib/utils';
import { usePolling } from '@/hooks/usePolling';
import { Droplets } from 'lucide-react';

const statusColors = {
  WAITING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-300',
  DONE: 'bg-green-100 text-green-800 border-green-300',
  DELIVERED: 'bg-slate-100 text-slate-600 border-slate-300',
};

const statusLabels = {
  WAITING: 'Esperando',
  IN_PROGRESS: 'En Lavado',
  DONE: 'Listo para entregar',
  DELIVERED: 'Entregado',
};

function ProgressBar({ turn }) {
  if (turn.status !== 'IN_PROGRESS' || !turn.started_at || !turn.estimated_minutes) return null;

  const elapsed = (Date.now() - new Date(turn.started_at).getTime()) / 60000;
  const pct = Math.min(100, (elapsed / turn.estimated_minutes) * 100);
  const overtime = pct >= 100;

  return (
    <div className="mt-3">
      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-1000', overtime ? 'bg-red-500' : 'bg-blue-400')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-slate-500">
        <span>{Math.floor(elapsed)} min</span>
        <span>{turn.estimated_minutes} min</span>
      </div>
    </div>
  );
}

export default function Display() {
  const { clientId } = useParams();
  const [turns, setTurns] = useState([]);

  const loadDisplay = useCallback(async () => {
    try {
      const { data } = await getDisplay(clientId);
      setTurns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading display:', err);
    }
  }, [clientId]);

  usePolling(loadDisplay, 10000);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Droplets className="w-10 h-10 text-blue-400" />
          <h1 className="text-4xl font-bold">Estado de Turnos</h1>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-bold text-blue-400">{timeStr}</div>
          <div className="flex items-center gap-2 mt-1 justify-end">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-slate-400">Actualizacion automatica</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {turns.map((turn) => (
          <div
            key={turn.id}
            className={cn(
              'bg-slate-800 rounded-xl p-5 border-2 transition-all',
              turn.status === 'IN_PROGRESS' ? 'border-blue-500 shadow-lg shadow-blue-500/20' :
              turn.status === 'DONE' ? 'border-green-500 shadow-lg shadow-green-500/20' :
              'border-slate-700'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-4xl font-bold">#{turn.daily_number}</span>
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-sm font-bold border',
                  statusColors[turn.status]
                )}
              >
                {statusLabels[turn.status]}
              </span>
            </div>
            <div className="text-2xl font-mono tracking-wider text-slate-200 mb-1 font-bold">
              {turn.plate}
            </div>
            {turn.started_at && (
              <div className="text-sm text-slate-500">
                Inicio: {formatTime(turn.started_at)}
              </div>
            )}
            <ProgressBar turn={turn} />

            {turn.status === 'DONE' && (
              <div className="mt-3 text-center py-2 bg-green-500/20 rounded-lg border border-green-500/30">
                <span className="text-green-400 font-bold text-lg animate-pulse">LISTO PARA RECOGER</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {turns.length === 0 && (
        <div className="text-center text-slate-500 text-xl mt-20">
          No hay turnos activos
        </div>
      )}
    </div>
  );
}
