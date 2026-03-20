import { useState, useCallback } from 'react';
import { listTurns, updateTurnStatus } from '@/api/turns';
import { formatCurrency, formatTime, cn } from '@/lib/utils';
import { usePolling } from '@/hooks/usePolling';
import Timer from '@/components/shared/Timer';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Clock, User, MoreVertical, Play, Pause, CheckCircle2, Truck, XCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const COLUMNS = [
  { key: 'WAITING', label: 'Esperando', color: 'bg-yellow-500', icon: Clock },
  { key: 'IN_PROGRESS', label: 'En Progreso', color: 'bg-blue-500', icon: Play },
  { key: 'PAUSED', label: 'Pausado', color: 'bg-orange-500', icon: Pause },
  { key: 'DONE', label: 'Terminado', color: 'bg-green-500', icon: CheckCircle2 },
  { key: 'DELIVERED', label: 'Entregado', color: 'bg-slate-500', icon: Truck },
  { key: 'CANCELLED', label: 'Cancelado', color: 'bg-red-500', icon: XCircle },
];

const STATUS_ACTIONS = {
  WAITING: [
    { label: 'Iniciar', status: 'IN_PROGRESS', icon: Play, color: 'text-blue-600' },
    { label: 'Cancelar', status: 'CANCELLED', icon: XCircle, color: 'text-red-600' },
  ],
  IN_PROGRESS: [
    { label: 'Completar', status: 'DONE', icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Pausar', status: 'PAUSED', icon: Pause, color: 'text-orange-600' },
    { label: 'Cancelar', status: 'CANCELLED', icon: XCircle, color: 'text-red-600' },
  ],
  PAUSED: [
    { label: 'Reanudar', status: 'IN_PROGRESS', icon: RotateCcw, color: 'text-blue-600' },
    { label: 'Cancelar', status: 'CANCELLED', icon: XCircle, color: 'text-red-600' },
  ],
  DONE: [
    { label: 'Entregar', status: 'DELIVERED', icon: Truck, color: 'text-slate-600' },
  ],
};

function isOvertime(turn) {
  if (turn.status !== 'IN_PROGRESS' || !turn.started_at || !turn.estimated_minutes) return false;
  const elapsed = (Date.now() - new Date(turn.started_at).getTime()) / 60000;
  return elapsed > turn.estimated_minutes;
}

function TurnCard({ turn, onAction }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const actions = STATUS_ACTIONS[turn.status] || [];
  const overtime = isOvertime(turn);

  return (
    <div className={cn(
      'bg-white rounded-lg p-3 shadow-sm border hover:shadow-md transition-shadow relative',
      overtime ? 'border-red-300 bg-red-50' : 'border-slate-100',
      turn.priority > 0 && 'ring-2 ring-amber-400'
    )}>
      {turn.priority > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          PRIORIDAD
        </span>
      )}

      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-lg text-slate-900">#{turn.daily_number}</span>
        <div className="flex items-center gap-1">
          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
            {turn.plate}
          </span>
          {actions.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <MoreVertical className="w-4 h-4 text-slate-400" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 min-w-[140px]">
                    {actions.map(a => (
                      <button
                        key={a.status}
                        onClick={() => { setMenuOpen(false); onAction(turn.id, a.status); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 text-left"
                      >
                        <a.icon className={cn('w-4 h-4', a.color)} />
                        <span>{a.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1 text-sm text-slate-600">
        {turn.assigned_employee_id && (
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span className="truncate">Empleado asignado</span>
          </div>
        )}
        {turn.estimated_minutes > 0 && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{turn.estimated_minutes} min est.</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
        <span className="font-semibold text-sm">{formatCurrency(turn.total_price)}</span>
        {turn.status === 'IN_PROGRESS' && turn.started_at ? (
          <Timer
            startTime={turn.started_at}
            className={cn('text-xs font-mono font-bold', overtime ? 'text-red-600' : 'text-blue-600')}
          />
        ) : turn.started_at ? (
          <span className="text-xs text-slate-400">{formatTime(turn.started_at)}</span>
        ) : null}
      </div>

      {overtime && (
        <div className="flex items-center gap-1 mt-1.5 text-red-600 text-xs font-medium">
          <AlertTriangle className="w-3 h-3" />
          <span>Tiempo excedido</span>
        </div>
      )}
    </div>
  );
}

export default function Board() {
  const [turns, setTurns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);

  const loadTurns = useCallback(async () => {
    try {
      const { data } = await listTurns();
      setTurns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading turns:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(loadTurns, 10000);

  const handleAction = (turnId, newStatus) => {
    if (newStatus === 'CANCELLED') {
      setConfirm({ turnId, status: newStatus });
      return;
    }
    executeStatusChange(turnId, newStatus);
  };

  const executeStatusChange = async (turnId, newStatus, reason = '') => {
    try {
      await updateTurnStatus(turnId, { status: newStatus, reason });
      toast.success(`Estado actualizado a ${COLUMNS.find(c => c.key === newStatus)?.label || newStatus}`);
      loadTurns();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar estado');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Tablero de Turnos</h1>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>{turns.length} turnos hoy</span>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>En vivo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {COLUMNS.map((col) => {
          const columnTurns = turns.filter((t) => t.status === col.key);
          const ColIcon = col.icon;
          return (
            <div key={col.key} className="bg-slate-50 rounded-xl p-3 min-h-[200px]">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn('w-2.5 h-2.5 rounded-full', col.color)} />
                <ColIcon className="w-4 h-4 text-slate-500" />
                <h2 className="font-semibold text-sm text-slate-700">{col.label}</h2>
                <span className="ml-auto text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full shadow-sm">
                  {columnTurns.length}
                </span>
              </div>

              <div className="space-y-2">
                {columnTurns.map((turn) => (
                  <TurnCard key={turn.id} turn={turn} onAction={handleAction} />
                ))}
                {columnTurns.length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-6">Sin turnos</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!confirm}
        title="Cancelar turno"
        message="Esta seguro que desea cancelar este turno? Esta accion no se puede deshacer."
        confirmText="Si, cancelar"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          executeStatusChange(confirm.turnId, confirm.status, 'Cancelado desde tablero');
          setConfirm(null);
        }}
      />
    </div>
  );
}
