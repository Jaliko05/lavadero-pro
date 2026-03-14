import React, { useEffect, useState } from 'react';
import { getStats, getRevenueTrend, getTurnsByStatus, getTopServices } from '@/api/dashboard';
import { formatCurrency } from '@/lib/utils';
import {
  Car,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  Droplets,
  ShoppingCart,
  AlertTriangle,
} from 'lucide-react';

function StatsCard({ icon: Icon, label, value, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data } = await getStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          icon={Car}
          label="Turnos hoy"
          value={stats?.turns_today || 0}
          color="blue"
        />
        <StatsCard
          icon={Clock}
          label="En progreso"
          value={stats?.turns_in_progress || 0}
          color="orange"
        />
        <StatsCard
          icon={DollarSign}
          label="Ventas hoy"
          value={formatCurrency(stats?.revenue_today || 0)}
          color="green"
        />
        <StatsCard
          icon={Users}
          label="Empleados activos"
          value={stats?.active_employees || 0}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Droplets}
          label="Esperando"
          value={stats?.turns_waiting || 0}
          color="blue"
        />
        <StatsCard
          icon={TrendingUp}
          label="Completados hoy"
          value={stats?.turns_completed_today || 0}
          color="green"
        />
        <StatsCard
          icon={ShoppingCart}
          label="Ventas mes"
          value={formatCurrency(stats?.revenue_month || 0)}
          color="purple"
        />
        <StatsCard
          icon={AlertTriangle}
          label="Insumos bajos"
          value={stats?.low_stock_supplies || 0}
          color="orange"
        />
      </div>
    </div>
  );
}
