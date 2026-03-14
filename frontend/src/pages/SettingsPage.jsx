import React from 'react';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Configuracion</h1>
      <div className="bg-white rounded-xl p-8 shadow-sm border text-center text-slate-500">
        <Settings className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>Modulo Configuracion - En construccion</p>
      </div>
    </div>
  );
}
