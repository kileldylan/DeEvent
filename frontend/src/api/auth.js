import axiosInstance from './axiosConfig';

export const authAPI = {
  login: async (email, password) => {
    const response = await axiosInstance.post('/auth/login/', { email, password });
    const { access, refresh, user } = response.data;
    
    // Store tokens and user data
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { access, refresh, user };
  },

  register: async (userData) => {
    const response = await axiosInstance.post('/auth/register/', userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    const response = await axiosInstance.get('/auth/user/');
    return response.data;
  },
};