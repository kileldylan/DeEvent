import axiosInstance from './axiosConfig';

export const authAPI = {
  login: async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/login/', { email, password });
      
      // Extract data from response - handle different response structures
      const responseData = response.data;
      
      // Check for different response structures
      let access, refresh, user;
      
      if (responseData.tokens) {
        // Structure 1: { tokens: { access, refresh }, user: {...} }
        access = responseData.tokens.access;
        refresh = responseData.tokens.refresh;
        user = responseData.user;
      } else if (responseData.access && responseData.refresh) {
        // Structure 2: { access, refresh, user: {...} }
        access = responseData.access;
        refresh = responseData.refresh;
        user = responseData.user || responseData;
      } else {
        // Structure 3: Direct user data
        access = responseData.access;
        refresh = responseData.refresh;
        user = responseData;
      }
      
      // Store tokens and user data
      if (access) {
        sessionStorage.setItem('access_token', access);
      }
      if (refresh) {
        sessionStorage.setItem('refresh_token', refresh);
      }
      if (user) {
        sessionStorage.setItem('user', JSON.stringify(user));
      }
      
      // Return consistent structure
      return { 
        access, 
        refresh, 
        user: user || responseData 
      };
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await axiosInstance.post('/auth/register/', userData);
      return response.data;
    } catch (error) {
      console.error('Register error:', error.response?.data || error.message);
      throw error;
    }
  },

  logout: () => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    try {
      const response = await axiosInstance.get('/auth/profile/'); // Changed from '/auth/user/'
      return response.data;
    } catch (error) {
      // If profile endpoint doesn't exist, try user endpoint
      if (error.response?.status === 404) {
        try {
          const response = await axiosInstance.get('/auth/user/');
          return response.data;
        } catch (secondError) {
          console.error('Get user error:', secondError.response?.data || secondError.message);
          throw secondError;
        }
      }
      console.error('Get profile error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Optional: Add token refresh
  refreshToken: async () => {
    try {
      const refreshToken = sessionStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await axiosInstance.post('/auth/token/refresh/', {
        refresh: refreshToken
      });
      
      const newAccessToken = response.data.access || response.data.tokens?.access;
      if (newAccessToken) {
        sessionStorage.setItem('access_token', newAccessToken);
        return newAccessToken;
      }
      return null;
    } catch (error) {
      console.error('Refresh token error:', error.response?.data || error.message);
      throw error;
    }
  },
};