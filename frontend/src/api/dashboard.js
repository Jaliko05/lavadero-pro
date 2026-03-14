import { apiClient } from './client';

export const getStats = () => apiClient.get('/v1/wash/admin/dashboard/stats');
export const getRevenueTrend = (params) => apiClient.get('/v1/wash/admin/dashboard/revenue-trend', { params });
export const getTurnsByStatus = () => apiClient.get('/v1/wash/admin/dashboard/turns-by-status');
export const getTopServices = (params) => apiClient.get('/v1/wash/admin/dashboard/top-services', { params });
export const getEmployeeRanking = (params) => apiClient.get('/v1/wash/admin/dashboard/employee-ranking', { params });
