import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  WAITING: { label: 'Esperando', bg: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  IN_PROGRESS: { label: 'En Progreso', bg: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  PAUSED: { label: 'Pausado', bg: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' },
  DONE: { label: 'Terminado', bg: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  DELIVERED: { label: 'Entregado', bg: 'bg-slate-100 text-slate-600', dot: 'bg-slate-500' },
  CANCELLED: { label: 'Cancelado', bg: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const config = STATUS_CONFIG[status] || { label: status, bg: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };
  const sizeClass = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full font-semibold', config.bg, sizeClass)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}

export { STATUS_CONFIG };
