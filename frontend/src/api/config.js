import { apiClient } from './client';

// Wash Config
export const getWashConfig = () => apiClient.get('/v1/wash/admin/config');
export const updateWashConfig = (data) => apiClient.put('/v1/wash/admin/config', data);

// Locations
export const listLocations = () => apiClient.get('/v1/wash/admin/locations');
export const createLocation = (data) => apiClient.post('/v1/wash/admin/locations', data);
export const updateLocation = (id, data) => apiClient.put(`/v1/wash/admin/locations/${id}`, data);
export const deleteLocation = (id) => apiClient.delete(`/v1/wash/admin/locations/${id}`);

// Notification Templates
export const listNotificationTemplates = () => apiClient.get('/v1/wash/admin/notification-templates');
export const createNotificationTemplate = (data) => apiClient.post('/v1/wash/admin/notification-templates', data);
export const updateNotificationTemplate = (id, data) => apiClient.put(`/v1/wash/admin/notification-templates/${id}`, data);
export const deleteNotificationTemplate = (id) => apiClient.delete(`/v1/wash/admin/notification-templates/${id}`);

// Discounts
export const listDiscounts = () => apiClient.get('/v1/wash/admin/discounts');
export const createDiscount = (data) => apiClient.post('/v1/wash/admin/discounts', data);
export const updateDiscount = (id, data) => apiClient.put(`/v1/wash/admin/discounts/${id}`, data);
export const deleteDiscount = (id) => apiClient.delete(`/v1/wash/admin/discounts/${id}`);
