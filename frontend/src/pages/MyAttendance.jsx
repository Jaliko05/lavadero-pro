import React from 'react';
import { Clock } from 'lucide-react';

export default function MyAttendance() {
  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-4">Mi Asistencia</h1>
      <div className="bg-white rounded-xl p-8 shadow-sm border text-center text-slate-500">
        <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>Modulo Asistencia - En construccion</p>
      </div>
    </div>
  );
}
