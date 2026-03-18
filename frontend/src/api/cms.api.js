import apiClient from './client';

export const cmsApi = {
  getSection: (section) => apiClient.get(`/cms/${section}`).then((r) => r.data.data),
};
