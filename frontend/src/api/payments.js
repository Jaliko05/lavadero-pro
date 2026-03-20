import { apiClient } from './client';

export const initWompiPayment = (data) => apiClient.post('/v1/wash/payments/wompi/init', data);
export const listPaymentMethods = () => apiClient.get('/v1/wash/payment-methods');
export const deletePaymentMethod = (id) => apiClient.delete(`/v1/wash/payment-methods/${id}`);
