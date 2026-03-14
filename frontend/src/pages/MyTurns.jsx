import React, { useEffect, useState } from 'react';
import { getMyTurns, updateMyTurnStatus } from '@/api/turns';
import { formatCurrency, formatTime, cn } from '@/lib/utils';
import { Car, Clock, Play, CheckCircle } from 'lucide-react';

const statusColors = {
  WAITING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  PAUSED: 'bg-orange-100 text-orange-800',
  DONE: 'bg-green-100 text-green-800',
};

const statusLabels = {
  WAITING: 'Esperando',
  IN_PROGRESS: 'En Progreso',
  PAUSED: 'Pausado',
  DONE: 'Terminado',
};

export default function MyTurns() {
  const [turns, setTurns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTurns();
  }, []);

  async function loadTurns() {
    try {
      const { data } = await getMyTurns();
      setTurns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading turns:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(turnId, newStatus) {
    try {
      await updateMyTurnStatus(turnId, { status: newStatus });
      loadTurns();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-4">Mis Turnos</h1>

      <div className="space-y-3">
        {turns.map((turn) => (
          <div key={turn.id} className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-lg">#{turn.daily_number}</span>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', statusColors[turn.status])}>
                {statusLabels[turn.status]}
              </span>
            </div>
            <div className="text-lg font-mono text-slate-600 mb-2">{turn.plate}</div>

            <div className="flex gap-2 mt-3">
              {turn.status === 'WAITING' && (
                <button
                  onClick={() => handleStatusChange(turn.id, 'IN_PROGRESS')}
                  className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium"
                >
                  <Play className="w-4 h-4" /> Iniciar
                </button>
              )}
              {turn.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => handleStatusChange(turn.id, 'DONE')}
                  className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium"
                >
                  <CheckCircle className="w-4 h-4" /> Terminar
                </button>
              )}
            </div>
          </div>
        ))}

        {turns.length === 0 && (
          <div className="text-center text-slate-500 py-8">
            <Car className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p>No tienes turnos asignados</p>
          </div>
        )}
      </div>
    </div>
  );
}
