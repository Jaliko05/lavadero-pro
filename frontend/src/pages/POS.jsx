import { useState, useEffect } from 'react';
import { listSales, createPayment, getCurrentCashRegister, openCashRegister, closeCashRegister } from '@/api/sales';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, CreditCard, DollarSign, Clock, Wallet } from 'lucide-react';
import { toast } from 'sonner';

export default function POS() {
  const [sales, setSales] = useState([]);
  const [register, setRegister] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ method: 'efectivo', amount: '', reference: '' });
  const [registerModal, setRegisterModal] = useState(null);
  const [registerForm, setRegisterForm] = useState({ opening_amount: '', closing_amount: '', notes: '' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [salesRes, regRes] = await Promise.allSettled([listSales(), getCurrentCashRegister()]);
      if (salesRes.status === 'fulfilled') setSales(salesRes.value.data);
      if (regRes.status === 'fulfilled') setRegister(regRes.value.data);
      else setRegister(null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handlePayment(e) {
    e.preventDefault();
    try {
      await createPayment({ sale_id: paymentModal.id, method: paymentForm.method, amount: parseFloat(paymentForm.amount), reference: paymentForm.reference });
      toast.success('Pago registrado');
      setPaymentModal(null);
      loadData();
    } catch { toast.error('Error al registrar pago'); }
  }

  async function handleOpenRegister(e) {
    e.preventDefault();
    try {
      await openCashRegister({ opening_amount: parseFloat(registerForm.opening_amount) });
      toast.success('Caja abierta');
      setRegisterModal(null);
      loadData();
    } catch { toast.error('Error al abrir caja'); }
  }

  async function handleCloseRegister(e) {
    e.preventDefault();
    try {
      await closeCashRegister({ closing_amount: parseFloat(registerForm.closing_amount), notes: registerForm.notes });
      toast.success('Caja cerrada');
      setRegisterModal(null);
      loadData();
    } catch { toast.error('Error al cerrar caja'); }
  }

  const pendingSales = sales.filter(s => s.payment_status === 'pendiente');

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Punto de Venta</h1>
        <div className="flex gap-2">
          {register ? (
            <button onClick={() => { setRegisterModal('close'); setRegisterForm({ closing_amount: '', notes: '' }); }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Cerrar Caja
            </button>
          ) : (
            <button onClick={() => { setRegisterModal('open'); setRegisterForm({ opening_amount: '' }); }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Abrir Caja
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="h-5 w-5 text-yellow-600" /></div>
          <div><p className="text-sm text-muted-foreground">Pendientes</p><p className="text-2xl font-bold">{pendingSales.length}</p></div>
        </div>
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg"><DollarSign className="h-5 w-5 text-green-600" /></div>
          <div><p className="text-sm text-muted-foreground">Total Ventas</p><p className="text-2xl font-bold">{formatCurrency(sales.reduce((s, v) => s + v.total, 0))}</p></div>
        </div>
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg"><ShoppingCart className="h-5 w-5 text-blue-600" /></div>
          <div><p className="text-sm text-muted-foreground">Caja</p><p className="text-2xl font-bold">{register ? 'Abierta' : 'Cerrada'}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b"><h2 className="font-semibold">Ventas Pendientes</h2></div>
        <div className="divide-y">
          {pendingSales.length === 0 ? (
            <p className="p-8 text-muted-foreground text-center">No hay ventas pendientes</p>
          ) : pendingSales.map(sale => (
            <div key={sale.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Venta #{sale.id.slice(0, 8)}</p>
                <p className="text-sm text-muted-foreground">Total: {formatCurrency(sale.total)} | Subtotal: {formatCurrency(sale.subtotal)}</p>
              </div>
              <button onClick={() => { setPaymentModal(sale); setPaymentForm({ method: 'efectivo', amount: String(sale.total), reference: '' }); }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Cobrar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPaymentModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Cobrar - {formatCurrency(paymentModal.total)}</h3>
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Metodo de Pago</label>
                <select value={paymentForm.method} onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  {['efectivo', 'nequi', 'daviplata', 'transferencia', 'tarjeta'].map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Monto</label>
                <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
              </div>
              {paymentForm.method !== 'efectivo' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Referencia</label>
                  <input type="text" value={paymentForm.reference} onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setPaymentModal(null)} className="flex-1 border rounded-lg py-2">Cancelar</button>
                <button type="submit" className="flex-1 bg-primary text-white rounded-lg py-2">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {registerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setRegisterModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{registerModal === 'open' ? 'Abrir Caja' : 'Cerrar Caja'}</h3>
            <form onSubmit={registerModal === 'open' ? handleOpenRegister : handleCloseRegister} className="space-y-4">
              {registerModal === 'open' ? (
                <div>
                  <label className="block text-sm font-medium mb-1">Monto Inicial</label>
                  <input type="number" value={registerForm.opening_amount} onChange={e => setRegisterForm({ ...registerForm, opening_amount: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Monto de Cierre</label>
                    <input type="number" value={registerForm.closing_amount} onChange={e => setRegisterForm({ ...registerForm, closing_amount: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notas</label>
                    <textarea value={registerForm.notes} onChange={e => setRegisterForm({ ...registerForm, notes: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows="3" />
                  </div>
                </>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setRegisterModal(null)} className="flex-1 border rounded-lg py-2">Cancelar</button>
                <button type="submit" className="flex-1 bg-primary text-white rounded-lg py-2">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
