import React, { useState, useMemo } from 'react';
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
  FileText,
  Wrench,
  Activity,
  CalendarCheck,
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { id: 'board', icon: ClipboardList, label: 'Tablero', path: '/board' },
  { id: 'reception', icon: Car, label: 'Recepcion', path: '/reception' },
  { id: 'pos', icon: ShoppingCart, label: 'POS', path: '/pos' },
  { id: 'employees', icon: Users, label: 'Empleados', path: '/employees' },
  { id: 'finance', icon: DollarSign, label: 'Finanzas', path: '/finance' },
  { id: 'inventory', icon: Package, label: 'Inventario', path: '/inventory' },
  { id: 'customers', icon: Heart, label: 'Clientes', path: '/customers' },
  { id: 'payroll', icon: FileText, label: 'Nomina', path: '/payroll' },
  { id: 'reports', icon: BarChart3, label: 'Reportes', path: '/reports' },
  { id: 'settings', icon: Settings, label: 'Configuracion', path: '/settings' },
];

const mySpaceItems = [
  { id: 'my-turns', icon: Wrench, label: 'Mis Turnos', path: '/my-turns' },
  { id: 'my-stats', icon: Activity, label: 'Mis Estadisticas', path: '/my-stats' },
  { id: 'my-attendance', icon: CalendarCheck, label: 'Mi Asistencia', path: '/my-attendance' },
];

const superAdminItem = { id: 'super-admin', icon: UserCog, label: 'Super Admin', path: '/super-admin' };

const ROLE_MENUS = {
  admin: ['dashboard', 'board', 'reception', 'pos', 'employees', 'finance', 'inventory', 'customers', 'payroll', 'reports', 'settings'],
  super_admin: ['dashboard', 'board', 'reception', 'pos', 'employees', 'finance', 'inventory', 'customers', 'payroll', 'reports', 'settings', 'super-admin'],
  lavador: ['my-turns', 'my-stats', 'my-attendance'],
  cajero: ['pos', 'customers'],
  recepcionista: ['board', 'reception', 'customers'],
};

function getAllowedMenuIds(roles) {
  if (!roles || (Array.isArray(roles) && roles.length === 0)) return null;
  const rolesArr = Array.isArray(roles) ? roles : [roles];
  const matched = rolesArr.filter(r => ROLE_MENUS[r]);
  if (matched.length === 0) return null; // fallback: show all
  const allowed = new Set();
  matched.forEach(r => ROLE_MENUS[r].forEach(id => allowed.add(id)));
  return allowed;
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout, hasRole } = useAuth();

  const allowedIds = useMemo(() => getAllowedMenuIds(user?.roles), [user?.roles]);

  const visibleMenuItems = useMemo(() => {
    if (!allowedIds) return menuItems;
    return menuItems.filter(item => allowedIds.has(item.id));
  }, [allowedIds]);

  const visibleMySpaceItems = useMemo(() => {
    if (!allowedIds) return [];
    return mySpaceItems.filter(item => allowedIds.has(item.id));
  }, [allowedIds]);

  const showSuperAdmin = useMemo(() => {
    if (!allowedIds) return true;
    return allowedIds.has('super-admin');
  }, [allowedIds]);

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
        {visibleMenuItems.map((item) => {
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

        {visibleMySpaceItems.length > 0 && (
          <>
            <div className={cn('mx-2 mt-4 mb-2 border-t border-slate-700 pt-3', collapsed && 'mx-1')}>
              {!collapsed && (
                <span className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Mi Espacio
                </span>
              )}
            </div>
            {visibleMySpaceItems.map((item) => {
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
          </>
        )}

        {showSuperAdmin && (
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
