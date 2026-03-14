import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicTurnStatus } from '@/api/turns';
import { formatTime, cn } from '@/lib/utils';
import { Droplets, Clock, Car, CheckCircle } from 'lucide-react';

const statusConfig = {
  WAITING: { label: 'Esperando', icon: Clock, color: 'text-yellow-500' },
  IN_PROGRESS: { label: 'En Lavado', icon: Droplets, color: 'text-blue-500' },
  DONE: { label: 'Listo para recoger', icon: CheckCircle, color: 'text-green-500' },
  DELIVERED: { label: 'Entregado', icon: Car, color: 'text-slate-500' },
};

export default function TurnStatus() {
  const { turnId } = useParams();
  const [turn, setTurn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, [turnId]);

  async function loadStatus() {
    try {
      const { data } = await getPublicTurnStatus(turnId);
      setTurn(data);
    } catch (err) {
      setError('Turno no encontrado');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">{error}</p>
      </div>
    );
  }

  const config = statusConfig[turn?.status] || statusConfig.WAITING;
  const StatusIcon = config.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        <Droplets className="w-10 h-10 text-blue-600 mx-auto mb-4" />

        <div className="text-6xl font-bold text-slate-900 mb-2">#{turn?.daily_number}</div>
        <div className="text-xl font-mono text-slate-500 mb-6">{turn?.plate}</div>

        <div className={cn('flex flex-col items-center gap-2', config.color)}>
          <StatusIcon className="w-12 h-12" />
          <span className="text-lg font-semibold">{config.label}</span>
        </div>
      </div>
    </div>
  );
}
