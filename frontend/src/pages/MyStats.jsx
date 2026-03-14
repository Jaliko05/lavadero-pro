import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function MyStats() {
  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-4">Mis Estadisticas</h1>
      <div className="bg-white rounded-xl p-8 shadow-sm border text-center text-slate-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>Modulo Estadisticas - En construccion</p>
      </div>
    </div>
  );
}
