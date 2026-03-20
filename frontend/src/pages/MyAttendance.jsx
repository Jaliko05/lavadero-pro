import { useState, useEffect } from 'react';
import { markAttendance, getEmployeeAttendance } from '@/api/employees';
import { formatDate, cn } from '@/lib/utils';
import { Clock, CheckCircle, Calendar, LogIn, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export default function MyAttendance() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useAuth();

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      if (user?.id) {
        const res = await getEmployeeAttendance(user.id);
        setHistory(Array.isArray(res.data) ? res.data : []);
      }
    } catch (e) {
      console.error('Error loading attendance history:', e);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleMark() {
    setLoading(true);
    try {
      const res = await markAttendance({ method: 'manual' });
      const msg = res.data?.message || 'Asistencia registrada';
      setResult(msg);
      toast.success(msg);
      loadHistory();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al registrar asistencia');
    } finally { setLoading(false); }
  }

  const now = currentTime;
  const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Monthly summary
  const thisMonth = history.filter(a => {
    const d = new Date(a.date || a.check_in);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalHours = thisMonth.reduce((sum, a) => sum + (a.hours_worked || 0), 0);
  const presentDays = thisMonth.filter(a => a.status === 'presente').length;
  const lateDays = thisMonth.filter(a => a.status === 'tardanza').length;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Mi Asistencia</h1>

      {/* Clock & Check-in */}
      <div className="bg-white rounded-xl p-6 border text-center">
        <Clock className="h-12 w-12 mx-auto text-primary mb-3" />
        <p className="text-4xl font-bold font-mono">{timeStr}</p>
        <p className="text-slate-500 text-sm mt-1 capitalize">{dateStr}</p>

        <button onClick={handleMark} disabled={loading}
          className="mt-6 px-8 py-3 bg-primary text-white rounded-xl text-lg font-semibold hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2">
          {loading ? (
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <CheckCircle className="h-5 w-5" />
          )}
          Registrar Asistencia
        </button>

        {result && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg text-green-700 text-sm font-medium">
            {result}
          </div>
        )}
      </div>

      {/* Monthly summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{presentDays}</p>
          <p className="text-xs text-slate-500">Dias Presente</p>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{lateDays}</p>
          <p className="text-xs text-slate-500">Tardanzas</p>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}</p>
          <p className="text-xs text-slate-500">Horas Mes</p>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <h2 className="font-semibold text-sm">Historial del Mes</h2>
        </div>
        {loadingHistory ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : thisMonth.length === 0 ? (
          <p className="p-8 text-center text-slate-400 text-sm">Sin registros este mes</p>
        ) : (
          <div className="divide-y">
            {thisMonth.map((att, idx) => (
              <div key={att.id || idx} className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {formatDate(att.date || att.check_in)}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                    {att.check_in && (
                      <span className="flex items-center gap-1">
                        <LogIn className="h-3 w-3" />
                        {new Date(att.check_in).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {att.check_out && (
                      <span className="flex items-center gap-1">
                        <LogOut className="h-3 w-3" />
                        {new Date(att.check_out).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {att.hours_worked != null && (
                      <span>{att.hours_worked}h</span>
                    )}
                  </div>
                </div>
                <span className={cn(
                  'text-xs px-2 py-1 rounded font-medium',
                  att.status === 'presente' ? 'bg-green-100 text-green-700' :
                  att.status === 'ausente' ? 'bg-red-100 text-red-700' :
                  att.status === 'tardanza' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-slate-100 text-slate-600'
                )}>
                  {att.status === 'presente' ? 'Presente' :
                   att.status === 'ausente' ? 'Ausente' :
                   att.status === 'tardanza' ? 'Tardanza' :
                   att.status || '-'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
