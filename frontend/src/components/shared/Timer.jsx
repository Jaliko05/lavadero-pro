import { useState, useEffect } from 'react';

export default function Timer({ startTime, className = '' }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!startTime) return;

    function update() {
      const start = new Date(startTime).getTime();
      const diff = Math.max(0, Date.now() - start);
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(`${mins}:${secs.toString().padStart(2, '0')}`);
    }

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  if (!startTime) return null;

  return <span className={className}>{elapsed}</span>;
}
