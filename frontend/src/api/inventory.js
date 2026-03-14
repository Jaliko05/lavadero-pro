import { apiClient } from './client';

// Supplies
export const listSupplies = (params) => apiClient.get('/v1/wash/admin/supplies', { params });
export const createSupply = (data) => apiClient.post('/v1/wash/admin/supplies', data);
export const updateSupply = (id, data) => apiClient.put(`/v1/wash/admin/supplies/${id}`, data);
export const deleteSupply = (id) => apiClient.delete(`/v1/wash/admin/supplies/${id}`);

// Supply Consumptions
export const listSupplyConsumptions = (params) => apiClient.get('/v1/wash/admin/supply-consumptions', { params });
export const createSupplyConsumption = (data) => apiClient.post('/v1/wash/admin/supply-consumptions', data);
export const updateSupplyConsumption = (id, data) => apiClient.put(`/v1/wash/admin/supply-consumptions/${id}`, data);
export const deleteSupplyConsumption = (id) => apiClient.delete(`/v1/wash/admin/supply-consumptions/${id}`);

// Suppliers
export const listSuppliers = (params) => apiClient.get('/v1/wash/admin/suppliers', { params });
export const createSupplier = (data) => apiClient.post('/v1/wash/admin/suppliers', data);
export const updateSupplier = (id, data) => apiClient.put(`/v1/wash/admin/suppliers/${id}`, data);
export const deleteSupplier = (id) => apiClient.delete(`/v1/wash/admin/suppliers/${id}`);

// Purchase Orders
export const listPurchaseOrders = (params) => apiClient.get('/v1/wash/admin/purchase-orders', { params });
export const createPurchaseOrder = (data) => apiClient.post('/v1/wash/admin/purchase-orders', data);
export const getPurchaseOrder = (id) => apiClient.get(`/v1/wash/admin/purchase-orders/${id}`);
export const updatePurchaseOrder = (id, data) => apiClient.put(`/v1/wash/admin/purchase-orders/${id}`, data);

// Inventory
export const getInventoryAlerts = () => apiClient.get('/v1/wash/admin/inventory/alerts');
export const submitInventoryCount = (data) => apiClient.post('/v1/wash/admin/inventory/count', data);
