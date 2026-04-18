import api from '../lib/api';

export const login = async (data: any) => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

export const signup = async (data: any) => {
  const response = await api.post('/auth/signup', data);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};
