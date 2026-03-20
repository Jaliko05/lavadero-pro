import { apiClient } from './client';

export const searchCustomers = (params) => apiClient.get('/v1/wash/customers/search', { params });
export const getCustomerHistory = (id) => apiClient.get(`/v1/wash/customers/${id}/history`);

// Admin
export const listCustomers = (params) => apiClient.get('/v1/wash/admin/customers', { params });
export const createCustomer = (data) => apiClient.post('/v1/wash/admin/customers', data);
export const updateCustomer = (id, data) => apiClient.put(`/v1/wash/admin/customers/${id}`, data);
export const deleteCustomer = (id) => apiClient.delete(`/v1/wash/admin/customers/${id}`);

// Customer Vehicles
export const listCustomerVehicles = (customerId) => apiClient.get('/v1/wash/admin/customer-vehicles', { params: { customer_id: customerId } });
export const createCustomerVehicle = (data) => apiClient.post('/v1/wash/admin/customer-vehicles', data);
export const updateCustomerVehicle = (id, data) => apiClient.put(`/v1/wash/admin/customer-vehicles/${id}`, data);
export const deleteCustomerVehicle = (id) => apiClient.delete(`/v1/wash/admin/customer-vehicles/${id}`);
