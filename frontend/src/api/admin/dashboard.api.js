import client from '../client';

const adminDashboardApi = {
  getStats: () => client.get('/admin/dashboard'),
};

export default adminDashboardApi;
