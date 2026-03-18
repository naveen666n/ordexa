import apiClient from './client';

export const configApi = {
  getPublic: () => apiClient.get('/config/public').then((r) => r.data.data),
};
