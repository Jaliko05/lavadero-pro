import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Car,
  ShoppingCart,
  Users,
  DollarSign,
  Package,
  Heart,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Droplets,
  ClipboardList,
  UserCog,
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ClipboardList, label: 'Tablero', path: '/board' },
  { icon: Car, label: 'Recepcion', path: '/reception' },
  { icon: ShoppingCart, label: 'POS', path: '/pos' },
  { icon: Users, label: 'Empleados', path: '/employees' },
  { icon: DollarSign, label: 'Finanzas', path: '/finance' },
  { icon: Package, label: 'Inventario', path: '/inventory' },
  { icon: Heart, label: 'Clientes', path: '/customers' },
  { icon: BarChart3, label: 'Reportes', path: '/reports' },
  { icon: Settings, label: 'Configuracion', path: '/settings' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout, hasRole } = useAuth();

  return (
    <aside
      className={cn(
        'h-screen bg-slate-900 text-white flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Droplets className="w-6 h-6 text-blue-400" />
            <span className="font-bold text-lg">LavaderoPro</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-slate-700"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}

        {hasRole('super_admin') && (
          <Link
            to="/super-admin"
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors mt-2 border-t border-slate-700 pt-4',
              location.pathname.startsWith('/super-admin')
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            )}
          >
            <UserCog className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Super Admin</span>}
          </Link>
        )}
      </nav>

      <div className="border-t border-slate-700 p-4">
        {!collapsed && user && (
          <div className="mb-2 text-xs text-slate-400 truncate">{user.email}</div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Cerrar sesion</span>}
        </button>
      </div>
    </aside>
  );
}
