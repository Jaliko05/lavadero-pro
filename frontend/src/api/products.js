import { apiClient } from './client';

export const listProducts = (params) => apiClient.get('/v1/wash/admin/products', { params });
export const createProduct = (data) => apiClient.post('/v1/wash/admin/products', data);
export const updateProduct = (id, data) => apiClient.put(`/v1/wash/admin/products/${id}`, data);
export const deleteProduct = (id) => apiClient.delete(`/v1/wash/admin/products/${id}`);
