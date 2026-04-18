import api from '../../lib/api';

export const fetchAccessories = async () => {
  const response = await api.get('/accessories');
  return response.data;
};
