import { apiClient } from './client';

// Expenses
export const listExpenses = (params) => apiClient.get('/v1/wash/admin/expenses', { params });
export const createExpense = (data) => apiClient.post('/v1/wash/admin/expenses', data);
export const updateExpense = (id, data) => apiClient.put(`/v1/wash/admin/expenses/${id}`, data);
export const deleteExpense = (id) => apiClient.delete(`/v1/wash/admin/expenses/${id}`);

// Recurring Expenses
export const listRecurringExpenses = () => apiClient.get('/v1/wash/admin/recurring-expenses');
export const createRecurringExpense = (data) => apiClient.post('/v1/wash/admin/recurring-expenses', data);
export const updateRecurringExpense = (id, data) => apiClient.put(`/v1/wash/admin/recurring-expenses/${id}`, data);
export const deleteRecurringExpense = (id) => apiClient.delete(`/v1/wash/admin/recurring-expenses/${id}`);

// Accounts Receivable
export const listAccountsReceivable = (params) => apiClient.get('/v1/wash/admin/accounts-receivable', { params });

// Reports
export const getCashFlow = (params) => apiClient.get('/v1/wash/admin/cash-flow', { params });
export const getProfitLoss = (params) => apiClient.get('/v1/wash/admin/profit-loss', { params });
