import api from '../../lib/api';

export const fetchWireWheels = async () => {
  const response = await api.get('/wire-wheels');
  return response.data;
};
