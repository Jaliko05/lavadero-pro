import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getDisplay } from '@/api/turns';
import { formatTime, cn } from '@/lib/utils';
import { Droplets } from 'lucide-react';

const statusColors = {
  WAITING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  DONE: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-slate-100 text-slate-600',
};

const statusLabels = {
  WAITING: 'Esperando',
  IN_PROGRESS: 'En Lavado',
  DONE: 'Listo',
  DELIVERED: 'Entregado',
};

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

  useEffect(() => {
    loadDisplay();
    const interval = setInterval(loadDisplay, 10000);
    return () => clearInterval(interval);
  }, [loadDisplay]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="flex items-center justify-center gap-3 mb-8">
        <Droplets className="w-10 h-10 text-blue-400" />
        <h1 className="text-4xl font-bold">Estado de Turnos</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {turns.map((turn) => (
          <div
            key={turn.id}
            className="bg-slate-800 rounded-xl p-5 border border-slate-700"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl font-bold">#{turn.daily_number}</span>
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-sm font-semibold',
                  statusColors[turn.status]
                )}
              >
                {statusLabels[turn.status]}
              </span>
            </div>
            <div className="text-xl font-mono tracking-wider text-slate-300 mb-1">
              {turn.plate}
            </div>
            {turn.started_at && (
              <div className="text-sm text-slate-500">
                Inicio: {formatTime(turn.started_at)}
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
