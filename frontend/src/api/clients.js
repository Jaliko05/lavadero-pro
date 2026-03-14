import { apiClient } from './client';

// Super Admin - Tenant management
export const listClients = () => apiClient.get('/v1/wash/super-admin/clients');
export const createClient = (data) => apiClient.post('/v1/wash/super-admin/clients', data);
export const updateClient = (id, data) => apiClient.put(`/v1/wash/super-admin/clients/${id}`, data);
export const deleteClient = (id) => apiClient.delete(`/v1/wash/super-admin/clients/${id}`);
