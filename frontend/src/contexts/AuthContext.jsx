import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';
import { Box, CircularProgress } from '@mui/material';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initial auth check (safe, no redirect here)
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // Try fresh fetch first
          const freshUser = await authAPI.getCurrentUser();
          console.log('Fresh user from /auth/profile/ or /auth/user/:', freshUser);
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } catch (err) {
          console.warn('Fresh fetch failed, using stored:', err);
          try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
          } catch (parseErr) {
            console.error('Stored user invalid:', parseErr);
            authAPI.logout();
          }
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Safe redirect helper
  const redirectBasedOnRole = (currentUser) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const isStaff = currentUser.is_staff ?? currentUser.isStaff ?? false;
    const isOrganizer = currentUser.is_organizer ?? currentUser.isOrganizer ?? false;
    const isSuperuser = currentUser.is_superuser ?? false;  // Add this check

    console.log('Role check:', { is_staff: isStaff, is_organizer: isOrganizer, is_superuser: isSuperuser });

    const path = window.location.pathname;

    // Skip if already on correct page
    if ((isSuperuser && path.startsWith('/admin')) ||
        (isOrganizer && !isSuperuser && path === '/organizations') ||
        (!isStaff && !isOrganizer && path === '/')) {
      console.log('Already on correct path - skipping redirect');
      return;
    }

    // Priority: superuser/admin first, then organizer, then default
    if (isSuperuser) {
      console.log('→ Admin dashboard');
      navigate('/admin-dashboard');
    } else if (isOrganizer) {
      console.log('→ Organizations');
      navigate('/organizations');
    } else {
      console.log('→ Default /');
      navigate('/');
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      const loggedInUser = response.user;
      console.log('Login response user:', loggedInUser);
      setUser(loggedInUser);
      redirectBasedOnRole(loggedInUser);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      await authAPI.register(userData);
      const loginResponse = await authAPI.login(userData.email, userData.password);
      const registeredUser = loginResponse.user;
      console.log('Register + auto-login user:', registeredUser);
      setUser(registeredUser);
      redirectBasedOnRole(registeredUser);
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: error.response?.data || 'Registration failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    navigate('/login');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.is_staff || false,
    isOrganizer: user?.is_organizer || false,
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};