import { useState } from 'react';
import { markAttendance } from '@/api/employees';
import { Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function MyAttendance() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleMark() {
    setLoading(true);
    try {
      const res = await markAttendance({ method: 'manual' });
      setResult(res.data.message);
      toast.success(res.data.message);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al registrar asistencia');
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Mi Asistencia</h1>

      <div className="bg-white rounded-xl p-8 border text-center">
        <div className="mb-6">
          <Clock className="h-16 w-16 mx-auto text-primary mb-4" />
          <p className="text-3xl font-bold">{new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
          <p className="text-slate-500">{new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <button onClick={handleMark} disabled={loading}
          className="px-8 py-4 bg-primary text-white rounded-2xl text-lg font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-3 mx-auto">
          {loading ? (
            <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <CheckCircle className="h-6 w-6" />
          )}
          Registrar Asistencia
        </button>

        {result && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg text-green-700 font-medium">
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
