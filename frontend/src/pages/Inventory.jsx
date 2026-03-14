import React from 'react';
import { Package } from 'lucide-react';

export default function Inventory() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Inventario</h1>
      <div className="bg-white rounded-xl p-8 shadow-sm border text-center text-slate-500">
        <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>Modulo Inventario - En construccion</p>
      </div>
    </div>
  );
}
