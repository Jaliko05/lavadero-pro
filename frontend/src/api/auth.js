import { authClient } from './client';

export const register = (data) => authClient.post('/v1/auth/register', data);
export const login = (data) => authClient.post('/v1/auth/login', data);
export const refresh = () => authClient.post('/v1/auth/refresh');
export const logout = () => authClient.post('/v1/auth/logout');
