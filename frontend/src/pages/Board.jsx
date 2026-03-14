import React, { useEffect, useState, useCallback } from 'react';
import { listTurns, updateTurnStatus } from '@/api/turns';
import { formatCurrency, formatTime, cn } from '@/lib/utils';
import { Car, Clock, User, MoreVertical } from 'lucide-react';

const COLUMNS = [
  { key: 'WAITING', label: 'Esperando', color: 'bg-yellow-500' },
  { key: 'IN_PROGRESS', label: 'En Progreso', color: 'bg-blue-500' },
  { key: 'DONE', label: 'Terminado', color: 'bg-green-500' },
  { key: 'DELIVERED', label: 'Entregado', color: 'bg-slate-500' },
];

function TurnCard({ turn, onStatusChange }) {
  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-lg text-slate-900">#{turn.daily_number}</span>
        <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
          {turn.plate}
        </span>
      </div>

      <div className="space-y-1 text-sm text-slate-600">
        {turn.vehicle_category && (
          <div className="flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5" />
            <span>{turn.vehicle_category.name}</span>
          </div>
        )}
        {turn.assigned_employee && (
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>{turn.assigned_employee.full_name}</span>
          </div>
        )}
        {turn.estimated_minutes > 0 && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{turn.estimated_minutes} min</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
        <span className="font-semibold text-sm">{formatCurrency(turn.total_price)}</span>
        {turn.started_at && (
          <span className="text-xs text-slate-400">{formatTime(turn.started_at)}</span>
        )}
      </div>
    </div>
  );
}

export default function Board() {
  const [turns, setTurns] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTurns = useCallback(async () => {
    try {
      const { data } = await listTurns({ status: 'active' });
      setTurns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading turns:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTurns();
    const interval = setInterval(loadTurns, 15000);
    return () => clearInterval(interval);
  }, [loadTurns]);

  const handleStatusChange = async (turnId, newStatus) => {
    try {
      await updateTurnStatus(turnId, { status: newStatus });
      loadTurns();
    } catch (err) {
      console.error('Error updating status:', err);
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
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Tablero de Turnos</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const columnTurns = turns.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="bg-slate-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${col.color}`} />
                <h2 className="font-semibold text-slate-700">{col.label}</h2>
                <span className="ml-auto text-sm font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full">
                  {columnTurns.length}
                </span>
              </div>

              <div className="space-y-2">
                {columnTurns.map((turn) => (
                  <TurnCard
                    key={turn.id}
                    turn={turn}
                    onStatusChange={handleStatusChange}
                  />
                ))}
                {columnTurns.length === 0 && (
                  <p className="text-center text-sm text-slate-400 py-8">Sin turnos</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
