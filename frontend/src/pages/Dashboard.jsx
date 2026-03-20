import React, { useEffect, useState } from 'react';
import { getStats, getRevenueTrend, getTurnsByStatus, getTopServices, getEmployeeRanking } from '@/api/dashboard';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
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

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ef4444', '#06b6d4'];

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

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-md">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

function ServiceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-md">
      <p className="text-xs text-slate-500 mb-1">{payload[0].payload.name}</p>
      <p className="text-sm font-semibold text-slate-900">{payload[0].value} turnos</p>
    </div>
  );
}

function EmployeeTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-md">
      <p className="text-xs text-slate-500 mb-1">{payload[0].payload.name}</p>
      <p className="text-sm font-semibold text-slate-900">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-md">
      <p className="text-xs text-slate-500 mb-1">{payload[0].name}</p>
      <p className="text-sm font-semibold text-slate-900">{payload[0].value} turnos</p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [turnsByStatus, setTurnsByStatus] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [employeeRanking, setEmployeeRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const results = await Promise.allSettled([
        getStats(),
        getRevenueTrend({ days: 30 }),
        getTurnsByStatus(),
        getTopServices({ limit: 6 }),
        getEmployeeRanking({ limit: 6 }),
      ]);

      if (results[0].status === 'fulfilled') setStats(results[0].value.data);
      if (results[1].status === 'fulfilled') setRevenueTrend(results[1].value.data || []);
      if (results[2].status === 'fulfilled') setTurnsByStatus(results[2].value.data || []);
      if (results[3].status === 'fulfilled') setTopServices(results[3].value.data || []);
      if (results[4].status === 'fulfilled') setEmployeeRanking(results[4].value.data || []);
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

      {/* Stat cards - row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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

      {/* Stat cards - row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      {/* Charts - 2x2 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue trend - Line chart */}
        <ChartCard title="Ingresos - Ultimos 30 dias">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(val) => formatDate(val)}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(val) => formatCurrency(val)}
                width={100}
              />
              <Tooltip content={<RevenueTooltip />} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Turns by status - Pie chart */}
        <ChartCard title="Turnos por estado">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={turnsByStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={50}
                paddingAngle={3}
                label={({ status, count }) => `${status}: ${count}`}
              >
                {turnsByStatus.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top services - Bar chart */}
        <ChartCard title="Servicios mas solicitados">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topServices}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip content={<ServiceTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {topServices.map((_, index) => (
                  <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Employee ranking - Horizontal bar chart */}
        <ChartCard title="Ranking de empleados">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={employeeRanking} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(val) => formatCurrency(val)}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: '#64748b' }}
                width={120}
              />
              <Tooltip content={<EmployeeTooltip />} />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                {employeeRanking.map((_, index) => (
                  <Cell key={`emp-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
