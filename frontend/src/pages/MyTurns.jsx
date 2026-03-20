import { useState, useCallback } from 'react';
import { getMyTurns, updateMyTurnStatus } from '@/api/turns';
import { formatCurrency, cn } from '@/lib/utils';
import { usePolling } from '@/hooks/usePolling';
import Timer from '@/components/shared/Timer';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Car, Play, Pause, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const statusConfig = {
  WAITING: { label: 'Esperando', bg: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-300' },
  IN_PROGRESS: { label: 'En Progreso', bg: 'bg-blue-100 text-blue-800', border: 'border-blue-500' },
  PAUSED: { label: 'Pausado', bg: 'bg-orange-100 text-orange-800', border: 'border-orange-400' },
  DONE: { label: 'Terminado', bg: 'bg-green-100 text-green-800', border: 'border-green-500' },
};

export default function MyTurns() {
  const [turns, setTurns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null);

  const loadTurns = useCallback(async () => {
    try {
      const { data } = await getMyTurns({ status: 'WAITING,IN_PROGRESS,PAUSED,DONE' });
      setTurns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading turns:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(loadTurns, 10000);

  async function handleStatusChange(turnId, newStatus) {
    try {
      await updateMyTurnStatus(turnId, { status: newStatus });
      toast.success(
        newStatus === 'IN_PROGRESS' ? 'Turno iniciado' :
        newStatus === 'PAUSED' ? 'Turno pausado' :
        newStatus === 'DONE' ? 'Turno completado' : 'Estado actualizado'
      );
      loadTurns();
    } catch (err) {
      toast.error('Error al actualizar estado');
    }
    setConfirmAction(null);
  }

  function isOvertime(turn) {
    if (turn.status !== 'IN_PROGRESS' || !turn.started_at || !turn.estimated_minutes) return false;
    const elapsed = (Date.now() - new Date(turn.started_at).getTime()) / 60000;
    return elapsed > turn.estimated_minutes;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const activeTurns = turns.filter(t => ['WAITING', 'IN_PROGRESS', 'PAUSED'].includes(t.status));
  const doneTurns = turns.filter(t => t.status === 'DONE');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Mis Turnos</h1>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-slate-500">Auto-actualiza</span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{activeTurns.length}</p>
          <p className="text-xs text-slate-500">Activos</p>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{doneTurns.length}</p>
          <p className="text-xs text-slate-500">Completados</p>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-orange-600">{turns.filter(t => isOvertime(t)).length}</p>
          <p className="text-xs text-slate-500">Fuera de tiempo</p>
        </div>
      </div>

      {/* Active turns */}
      <div className="space-y-3">
        {activeTurns.map(turn => {
          const overtime = isOvertime(turn);
          const cfg = statusConfig[turn.status] || statusConfig.WAITING;
          return (
            <div
              key={turn.id}
              className={cn(
                'bg-white rounded-xl p-4 border-2 transition-all',
                overtime ? 'border-red-500 bg-red-50' : cfg.border
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">#{turn.daily_number}</span>
                  {overtime && <AlertTriangle className="h-4 w-4 text-red-500" />}
                </div>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', cfg.bg)}>
                  {cfg.label}
                </span>
              </div>

              <div className="text-xl font-mono font-bold text-slate-700 mb-1">{turn.plate}</div>

              {turn.services && turn.services.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {turn.services.map((s, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 rounded">{s.service_name || s.name}</span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                {turn.started_at && (
                  <div className="flex items-center gap-1">
                    <span>Tiempo:</span>
                    <Timer startTime={turn.started_at} className={cn('font-mono font-bold', overtime ? 'text-red-600' : 'text-blue-600')} />
                  </div>
                )}
                {turn.estimated_minutes && (
                  <span>Est: {turn.estimated_minutes} min</span>
                )}
              </div>

              {/* Progress bar */}
              {turn.status === 'IN_PROGRESS' && turn.started_at && turn.estimated_minutes && (
                <div className="mb-3">
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', overtime ? 'bg-red-500' : 'bg-blue-500')}
                      style={{ width: `${Math.min(100, ((Date.now() - new Date(turn.started_at).getTime()) / 60000 / turn.estimated_minutes) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {turn.status === 'WAITING' && (
                  <button
                    onClick={() => handleStatusChange(turn.id, 'IN_PROGRESS')}
                    className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    <Play className="w-4 h-4" /> Iniciar
                  </button>
                )}
                {turn.status === 'IN_PROGRESS' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(turn.id, 'PAUSED')}
                      className="flex-1 flex items-center justify-center gap-1 bg-orange-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600"
                    >
                      <Pause className="w-4 h-4" /> Pausar
                    </button>
                    <button
                      onClick={() => setConfirmAction({ id: turn.id, status: 'DONE', plate: turn.plate })}
                      className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" /> Completar
                    </button>
                  </>
                )}
                {turn.status === 'PAUSED' && (
                  <button
                    onClick={() => handleStatusChange(turn.id, 'IN_PROGRESS')}
                    className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    <Play className="w-4 h-4" /> Reanudar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completed today */}
      {doneTurns.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 mb-2">Completados</h2>
          <div className="space-y-2">
            {doneTurns.map(turn => (
              <div key={turn.id} className="bg-white rounded-lg p-3 border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-bold">#{turn.daily_number}</span>
                  <span className="font-mono text-slate-600">{turn.plate}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  Listo
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {turns.length === 0 && (
        <div className="text-center text-slate-500 py-12">
          <Car className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">No tienes turnos asignados</p>
          <p className="text-sm mt-1">Los turnos apareceran aqui cuando te sean asignados</p>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        title="Completar Turno"
        message={confirmAction ? `Confirmar que el turno de ${confirmAction.plate} esta terminado?` : ''}
        confirmText="Completar"
        variant="default"
        onConfirm={() => confirmAction && handleStatusChange(confirmAction.id, confirmAction.status)}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
