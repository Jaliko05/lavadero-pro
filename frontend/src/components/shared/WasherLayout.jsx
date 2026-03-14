import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { ClipboardList, Clock, BarChart3, LogOut, Droplets } from 'lucide-react';

const tabs = [
  { icon: ClipboardList, label: 'Mis Turnos', path: '/my/turns' },
  { icon: Clock, label: 'Asistencia', path: '/my/attendance' },
  { icon: BarChart3, label: 'Estadisticas', path: '/my/stats' },
];

export default function WasherLayout() {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-400" />
          <span className="font-bold">LavaderoPro</span>
        </div>
        <button onClick={logout} className="text-slate-400 hover:text-white">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <Outlet />
      </main>

      <nav className="bg-white border-t border-slate-200 flex">
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                'flex-1 flex flex-col items-center py-2 text-xs',
                isActive ? 'text-blue-600' : 'text-slate-500'
              )}
            >
              <tab.icon className="w-5 h-5 mb-1" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
