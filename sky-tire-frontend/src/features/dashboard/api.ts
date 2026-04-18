import api from '../../lib/api';

export const fetchAnalytics = async () => {
  const response = await api.get('/admin/analytics');
  return response.data;
};
