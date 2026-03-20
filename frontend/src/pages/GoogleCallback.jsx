import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Droplets, Loader2 } from 'lucide-react';

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setError('No se recibio el codigo de autorizacion');
      return;
    }

    loginWithGoogle(code)
      .then(() => {
        navigate('/dashboard', { replace: true });
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Error al iniciar sesion con Google');
      });
  }, [searchParams, loginWithGoogle, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Droplets className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900">LavaderoPro</h1>
        </div>

        {error ? (
          <div className="space-y-4">
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            <Link
              to="/login"
              className="inline-block text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
            >
              Volver al login
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-slate-600 text-sm">Procesando autenticacion...</p>
          </div>
        )}
      </div>
    </div>
  );
}
