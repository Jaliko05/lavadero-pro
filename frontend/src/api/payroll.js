import { apiClient } from './client';

export const generatePayroll = (data) => apiClient.post('/v1/wash/admin/payroll/generate', data);
export const listPayroll = (params) => apiClient.get('/v1/wash/admin/payroll', { params });
export const getPayroll = (id) => apiClient.get(`/v1/wash/admin/payroll/${id}`);
export const approvePayroll = (id) => apiClient.patch(`/v1/wash/admin/payroll/${id}/approve`);
