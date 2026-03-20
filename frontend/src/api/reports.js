import { apiClient } from './client';

export const getSalesReport = (params) => apiClient.get('/v1/wash/admin/reports/sales', { params });
export const getVehiclesReport = (params) => apiClient.get('/v1/wash/admin/reports/vehicles', { params });
export const getAttendanceReport = (params) => apiClient.get('/v1/wash/admin/reports/attendance', { params });
export const getPerformanceReport = (params) => apiClient.get('/v1/wash/admin/reports/performance', { params });
export const getPayrollReport = (params) => apiClient.get('/v1/wash/admin/reports/payroll', { params });
export const getClientsReport = (params) => apiClient.get('/v1/wash/admin/reports/clients', { params });
export const getInventoryReport = (params) => apiClient.get('/v1/wash/admin/reports/inventory', { params });
export const getInventoryMovementsReport = (params) => apiClient.get('/v1/wash/admin/reports/inventory-movements', { params });

// CSV Export
export const exportCSV = (type, params) => apiClient.get(`/v1/wash/admin/reports/${type}/csv`, { params, responseType: 'blob' });
