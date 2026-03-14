import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function Reports() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Reportes</h1>
      <div className="bg-white rounded-xl p-8 shadow-sm border text-center text-slate-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>Modulo Reportes - En construccion</p>
      </div>
    </div>
  );
}
