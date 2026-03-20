import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import PrivateRoute from '@/components/auth/PrivateRoute';
import RequireRole from '@/components/auth/RequireRole';
import AdminLayout from '@/components/shared/AdminLayout';
import PublicLayout from '@/components/shared/PublicLayout';
import WasherLayout from '@/components/shared/WasherLayout';

// Pages
import Login from '@/pages/Login';
import GoogleCallback from '@/pages/GoogleCallback';
import Dashboard from '@/pages/Dashboard';
import Board from '@/pages/Board';
import Reception from '@/pages/Reception';
import Display from '@/pages/Display';
import TurnStatus from '@/pages/TurnStatus';
import POS from '@/pages/POS';
import Employees from '@/pages/Employees';
import Finance from '@/pages/Finance';
import Inventory from '@/pages/Inventory';
import Customers from '@/pages/Customers';
import Reports from '@/pages/Reports';
import SettingsPage from '@/pages/SettingsPage';
import Payroll from '@/pages/Payroll';
import SuperAdmin from '@/pages/SuperAdmin';

// Washer pages
import MyTurns from '@/pages/MyTurns';
import MyAttendance from '@/pages/MyAttendance';
import MyStats from '@/pages/MyStats';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<GoogleCallback />} />
            <Route path="/display/:clientId" element={<Display />} />
            <Route path="/turn-status/:turnId" element={<TurnStatus />} />
          </Route>

          {/* Admin routes */}
          <Route
            element={
              <PrivateRoute>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/board" element={<Board />} />
            <Route path="/reception" element={<Reception />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route
              path="/super-admin"
              element={
                <RequireRole role="super_admin">
                  <SuperAdmin />
                </RequireRole>
              }
            />
          </Route>

          {/* Washer (mobile) routes */}
          <Route
            element={
              <PrivateRoute>
                <WasherLayout />
              </PrivateRoute>
            }
          >
            <Route path="/my/turns" element={<MyTurns />} />
            <Route path="/my/attendance" element={<MyAttendance />} />
            <Route path="/my/stats" element={<MyStats />} />
          </Route>

          {/* Redirect root */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
