import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Printer, X } from 'lucide-react';

export default function Receipt({ open, onClose, turn, config = {} }) {
  if (!open || !turn) return null;

  const qrUrl = `${window.location.origin}/turn-status/${turn.id}`;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:bg-transparent print:static" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-sm print:max-w-none print:shadow-none print:rounded-none" onClick={e => e.stopPropagation()}>
        {/* Print actions - hidden when printing */}
        <div className="flex items-center justify-between p-3 border-b print:hidden">
          <h3 className="font-semibold">Recibo</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90">
              <Printer className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Receipt content */}
        <div className="p-6 text-center text-sm" id="receipt-content">
          {/* Header */}
          <div className="mb-4">
            <h2 className="text-lg font-bold">{config.business_name || 'LavaderoPro'}</h2>
            {config.nit && <p className="text-xs text-slate-500">NIT: {config.nit}</p>}
            {config.address && <p className="text-xs text-slate-500">{config.address}</p>}
            {config.phones && <p className="text-xs text-slate-500">Tel: {config.phones}</p>}
          </div>

          <div className="border-t border-dashed my-3" />

          {/* Turn info */}
          <div className="text-left space-y-1 mb-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Turno:</span>
              <span className="font-bold">#{turn.daily_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Placa:</span>
              <span className="font-mono font-bold text-lg">{turn.plate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fecha:</span>
              <span>{formatDateTime(turn.created_at)}</span>
            </div>
            {turn.customer_name && (
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <span>{turn.customer_name}</span>
              </div>
            )}
            {turn.employee_name && (
              <div className="flex justify-between">
                <span className="text-slate-500">Lavador:</span>
                <span>{turn.employee_name}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed my-3" />

          {/* Services */}
          {turn.services && turn.services.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-left mb-1">SERVICIOS:</p>
              <div className="text-left space-y-1">
                {turn.services.map((s, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{s.service_name || s.name}</span>
                    <span>{formatCurrency(s.price || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-dashed my-3" />

          {/* Total */}
          <div className="flex justify-between items-center text-lg font-bold mb-4">
            <span>TOTAL:</span>
            <span>{formatCurrency(turn.total_price || turn.total || 0)}</span>
          </div>

          {/* QR Code placeholder - using a text-based approach */}
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2">Consulta el estado de tu vehiculo:</p>
            <div className="inline-block border-2 border-slate-900 rounded p-3">
              <div className="w-24 h-24 bg-slate-100 flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(qrUrl)}`}
                  alt="QR"
                  className="w-24 h-24"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1 break-all">{qrUrl}</p>
          </div>

          <div className="border-t border-dashed my-3" />

          <p className="text-xs text-slate-500">Gracias por su visita</p>
          {config.business_name && <p className="text-xs text-slate-400">{config.business_name}</p>}
        </div>
      </div>
    </div>
  );
}
