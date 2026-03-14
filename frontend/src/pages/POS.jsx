import React from 'react';
import { ShoppingCart } from 'lucide-react';

export default function POS() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Punto de Venta</h1>
      <div className="bg-white rounded-xl p-8 shadow-sm border text-center text-slate-500">
        <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>Modulo POS - En construccion</p>
      </div>
    </div>
  );
}
