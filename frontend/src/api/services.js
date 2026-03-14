import { apiClient, publicClient } from './client';

// Public
export const listPublicServices = (params) => publicClient.get('/v1/wash/services', { params });

// Admin
export const listServices = () => apiClient.get('/v1/wash/admin/services');
export const createService = (data) => apiClient.post('/v1/wash/admin/services', data);
export const updateService = (id, data) => apiClient.put(`/v1/wash/admin/services/${id}`, data);
export const deleteService = (id) => apiClient.delete(`/v1/wash/admin/services/${id}`);

// Service Prices
export const listServicePrices = (params) => apiClient.get('/v1/wash/admin/service-prices', { params });
export const createServicePrice = (data) => apiClient.post('/v1/wash/admin/service-prices', data);
export const updateServicePrice = (id, data) => apiClient.put(`/v1/wash/admin/service-prices/${id}`, data);
export const deleteServicePrice = (id) => apiClient.delete(`/v1/wash/admin/service-prices/${id}`);

// Service Packages
export const listServicePackages = () => apiClient.get('/v1/wash/admin/service-packages');
export const createServicePackage = (data) => apiClient.post('/v1/wash/admin/service-packages', data);
export const updateServicePackage = (id, data) => apiClient.put(`/v1/wash/admin/service-packages/${id}`, data);
export const deleteServicePackage = (id) => apiClient.delete(`/v1/wash/admin/service-packages/${id}`);
