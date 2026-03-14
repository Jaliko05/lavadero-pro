import { apiClient } from './client';

export const listEmployees = (params) => apiClient.get('/v1/wash/admin/employees', { params });
export const createEmployee = (data) => apiClient.post('/v1/wash/admin/employees', data);
export const getEmployee = (id) => apiClient.get(`/v1/wash/admin/employees/${id}`);
export const updateEmployee = (id, data) => apiClient.put(`/v1/wash/admin/employees/${id}`, data);
export const deleteEmployee = (id) => apiClient.delete(`/v1/wash/admin/employees/${id}`);
export const getEmployeeAttendance = (id, params) => apiClient.get(`/v1/wash/admin/employees/${id}/attendance`, { params });
export const getEmployeePerformance = (id, params) => apiClient.get(`/v1/wash/admin/employees/${id}/performance`, { params });

// Commissions
export const listCommissions = () => apiClient.get('/v1/wash/admin/commissions');
export const createCommission = (data) => apiClient.post('/v1/wash/admin/commissions', data);
export const updateCommission = (id, data) => apiClient.put(`/v1/wash/admin/commissions/${id}`, data);
export const deleteCommission = (id) => apiClient.delete(`/v1/wash/admin/commissions/${id}`);

// Schedules
export const listSchedules = (params) => apiClient.get('/v1/wash/admin/schedules', { params });
export const createSchedule = (data) => apiClient.post('/v1/wash/admin/schedules', data);
export const updateSchedule = (id, data) => apiClient.put(`/v1/wash/admin/schedules/${id}`, data);
export const deleteSchedule = (id) => apiClient.delete(`/v1/wash/admin/schedules/${id}`);

// Attendance (employee self-service)
export const markAttendance = (data) => apiClient.post('/v1/wash/my/attendance', data);
