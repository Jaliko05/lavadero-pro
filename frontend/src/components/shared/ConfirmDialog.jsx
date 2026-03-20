export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmText = 'Confirmar', variant = 'danger' }) {
  if (!open) return null;

  const btnClass = variant === 'danger'
    ? 'bg-red-600 text-white hover:bg-red-700'
    : 'bg-blue-600 text-white hover:bg-blue-700';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white rounded-lg p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border rounded-lg py-2 text-sm font-medium hover:bg-slate-50">
            Cancelar
          </button>
          <button onClick={onConfirm} className={`flex-1 rounded-lg py-2 text-sm font-medium ${btnClass}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
