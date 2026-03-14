import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTurn } from '@/api/turns';
import { listPublicServices } from '@/api/services';
import { listPublicCategories } from '@/api/vehicle-categories';
import { searchCustomers } from '@/api/customers';
import { formatCurrency, cn } from '@/lib/utils';
import { Car, Search, Plus, Check } from 'lucide-react';

export default function Reception() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [plate, setPlate] = useState('');
  const [observations, setObservations] = useState('');
  const [customerId, setCustomerId] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [catRes, svcRes] = await Promise.all([
        listPublicCategories(),
        listPublicServices(),
      ]);
      setCategories(catRes.data || []);
      setServices(svcRes.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  }

  async function handleSearchCustomer() {
    if (!customerSearch.trim()) return;
    try {
      const { data } = await searchCustomers({ q: customerSearch });
      setCustomerResults(data || []);
    } catch (err) {
      console.error('Error searching customer:', err);
    }
  }

  function toggleService(serviceId) {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!plate || !selectedCategory || selectedServices.length === 0) {
      setError('Placa, tipo de vehiculo y al menos un servicio son requeridos');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await createTurn({
        plate: plate.toUpperCase(),
        vehicle_category_id: selectedCategory,
        customer_id: customerId || undefined,
        service_ids: selectedServices,
        observations,
      });
      navigate('/board');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear turno');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Recepcion de Vehiculo</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
        )}

        {/* Plate */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Placa</label>
          <input
            type="text"
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder="ABC123"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-lg font-mono tracking-wider uppercase focus:ring-2 focus:ring-blue-500"
            maxLength={7}
            required
          />
        </div>

        {/* Customer Search */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cliente (opcional)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Buscar por nombre, telefono o placa..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
            />
            <button
              type="button"
              onClick={handleSearchCustomer}
              className="px-3 py-2 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
          {customerResults.length > 0 && (
            <div className="mt-2 border border-slate-200 rounded-lg divide-y">
              {customerResults.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCustomerId(c.id);
                    setCustomerSearch(c.name);
                    setCustomerResults([]);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-slate-400 ml-2">{c.phone}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Vehicle Category */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de vehiculo</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'p-3 rounded-lg border-2 text-center transition-all',
                  selectedCategory === cat.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <span className="text-2xl block mb-1">{cat.icon || '🚗'}</span>
                <span className="text-xs font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Services */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Servicios</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {services.map((svc) => (
              <button
                key={svc.id}
                type="button"
                onClick={() => toggleService(svc.id)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all',
                  selectedServices.includes(svc.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                    selectedServices.includes(svc.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-slate-300'
                  )}
                >
                  {selectedServices.includes(svc.id) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{svc.name}</p>
                  <p className="text-xs text-slate-500">{svc.category}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Observations */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            placeholder="Rayones, objetos dentro del vehiculo, etc."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {loading ? 'Registrando...' : 'Registrar Turno'}
        </button>
      </form>
    </div>
  );
}
