import api from '../../lib/api';

export const fetchWheels = async () => {
  const response = await api.get('/wheels');
  return response.data;
};
