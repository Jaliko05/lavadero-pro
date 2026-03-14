import { apiClient, publicClient } from './client';

export const createTurn = (data) => apiClient.post('/v1/wash/turns', data);
export const listTurns = (params) => apiClient.get('/v1/wash/turns', { params });
export const getTurn = (id) => apiClient.get(`/v1/wash/turns/${id}`);
export const updateTurnStatus = (id, data) => apiClient.patch(`/v1/wash/turns/${id}/status`, data);
export const assignTurn = (id, data) => apiClient.patch(`/v1/wash/turns/${id}/assign`, data);
export const addTurnService = (id, data) => apiClient.post(`/v1/wash/turns/${id}/services`, data);
export const getTurnPhotos = (id) => apiClient.get(`/v1/wash/turns/${id}/photos`);
export const getTurnStatusHistory = (id) => apiClient.get(`/v1/wash/turns/${id}/status-history`);

// Employee's own turns
export const getMyTurns = (params) => apiClient.get('/v1/wash/my/turns', { params });
export const updateMyTurnStatus = (id, data) => apiClient.patch(`/v1/wash/my/turns/${id}/status`, data);

// Public
export const getPublicTurnStatus = (turnId) => publicClient.get(`/v1/wash/turn-status/${turnId}`);
export const getDisplay = (clientId) => publicClient.get(`/v1/wash/display/${clientId}`);
