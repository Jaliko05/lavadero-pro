import { apiClient } from './client';

export const getLoyaltyConfig = () => apiClient.get('/v1/wash/admin/loyalty-config');
export const updateLoyaltyConfig = (data) => apiClient.put('/v1/wash/admin/loyalty-config', data);
