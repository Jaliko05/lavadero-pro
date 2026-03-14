import { apiClient, publicClient } from './client';

// Public
export const listPublicCategories = (params) => publicClient.get('/v1/wash/vehicle-categories', { params });

// Admin
export const listCategories = () => apiClient.get('/v1/wash/admin/vehicle-categories');
export const createCategory = (data) => apiClient.post('/v1/wash/admin/vehicle-categories', data);
export const updateCategory = (id, data) => apiClient.put(`/v1/wash/admin/vehicle-categories/${id}`, data);
export const deleteCategory = (id) => apiClient.delete(`/v1/wash/admin/vehicle-categories/${id}`);
