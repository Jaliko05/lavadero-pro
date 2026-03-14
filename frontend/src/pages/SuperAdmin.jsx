import React from 'react';
import { UserCog } from 'lucide-react';

export default function SuperAdmin() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Super Admin - Tenants</h1>
      <div className="bg-white rounded-xl p-8 shadow-sm border text-center text-slate-500">
        <UserCog className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>Gestion de Tenants - En construccion</p>
      </div>
    </div>
  );
}
