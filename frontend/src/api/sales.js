import { apiClient } from './client';

export const createSale = (data) => apiClient.post('/v1/wash/sales', data);
export const listSales = (params) => apiClient.get('/v1/wash/sales', { params });

export const createPayment = (data) => apiClient.post('/v1/wash/payments', data);

// Cash register
export const openCashRegister = (data) => apiClient.post('/v1/wash/cash-register/open', data);
export const closeCashRegister = (data) => apiClient.post('/v1/wash/cash-register/close', data);
export const getCurrentCashRegister = () => apiClient.get('/v1/wash/cash-register/current');
