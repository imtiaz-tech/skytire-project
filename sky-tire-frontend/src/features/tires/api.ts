import api from '../../lib/api';

export const fetchTires = async () => {
  const response = await api.get('/tires');
  return response.data;
};

export const fetchTireById = async (id: string) => {
  const response = await api.get(`/tires/${id}`);
  return response.data;
};
